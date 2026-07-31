package Authentication.backend_java.controller;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import Authentication.backend_java.dto.response.UserResponse;
import Authentication.backend_java.exception.ApiException;
import Authentication.backend_java.model.User;
import Authentication.backend_java.repository.UserRepository;
import Authentication.backend_java.security.JwtAuthenticationFilter;

@RestController
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** GET /api/account — any authenticated role. */
    @GetMapping("/api/account")
    public AccountBody account(@AuthenticationPrincipal JwtAuthenticationFilter.AuthenticatedUser principal) {
        if (principal == null) throw ApiException.unauthorized();
        User user = userRepository.findById(principal.userId()).orElseThrow(ApiException::unauthorized);
        return new AccountBody(UserResponse.from(user));
    }
    @GetMapping("/api/manager/overview")
    public MessageBody managerOverview() {
        return new MessageBody("Manager workspace placeholder — wire up real data here.");
    }

    public record AccountBody(UserResponse user) {}
    public record MessageBody(String message) {}
}
