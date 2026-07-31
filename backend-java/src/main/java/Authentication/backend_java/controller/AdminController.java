package Authentication.backend_java.controller;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Authentication.backend_java.dto.request.UpdateRoleRequest;
import Authentication.backend_java.dto.response.AdminUserResponse;
import Authentication.backend_java.exception.ApiException;
import Authentication.backend_java.model.Role;
import Authentication.backend_java.model.User;
import Authentication.backend_java.repository.UserRepository;
import Authentication.backend_java.security.JwtAuthenticationFilter;
import Authentication.backend_java.security.RefreshTokenService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    public AdminController(UserRepository userRepository, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
    }

    /** GET /api/admin/users */
    @GetMapping("/users")
    public UsersBody listUsers() {
        List<AdminUserResponse> users = userRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(AdminUserResponse::from)
                .toList();
        return new UsersBody(users);
    }

    /** PATCH /api/admin/users/{id}/role */
    @PatchMapping("/users/{id}/role")
    public UpdatedRoleBody updateUserRole(@PathVariable String id, @Valid @RequestBody UpdateRoleRequest req,
                                           @AuthenticationPrincipal JwtAuthenticationFilter.AuthenticatedUser principal) {
        Role role;
        try {
            role = Role.valueOf(req.getRole());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("The admin role can only be granted directly in the database.");
        }
        if (!Role.isPromotable(role)) {
            throw ApiException.badRequest("The admin role can only be granted directly in the database.");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found."));

        if (target.getRole() == Role.admin) {
            throw ApiException.forbidden("Admin accounts can't be changed from the API.");
        }
        if (target.getId().equals(principal.userId())) {
            throw ApiException.badRequest("You can't change your own role.");
        }

        target.setRole(role);
        userRepository.save(target);

        refreshTokenService.revokeAllForUser(target.getId());

        return new UpdatedRoleBody(new UpdatedUser(target.getId(), target.getName(), target.getEmail(), target.getRole()));
    }

    public record UsersBody(List<AdminUserResponse> users) {}
    public record UpdatedRoleBody(UpdatedUser user) {}
    public record UpdatedUser(String id, String name, String email, Role role) {}
}
