package Authentication.backend_java.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import Authentication.backend_java.exception.ErrorResponse;
import Authentication.backend_java.model.User;
import Authentication.backend_java.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

/** Reads the `Authorization: Bearer <token>` header, mirroring middleware/authenticate.ts. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            // No token supplied: let the request through unauthenticated. Spring Security's
            // access rules decide whether the endpoint actually requires auth.
            chain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring("Bearer ".length());
            JwtService.AccessTokenPayload payload = jwtService.verifyAccessToken(token);

            Optional<User> userOpt = userRepository.findById(payload.userId());
            if (userOpt.isEmpty()) {
                writeUnauthorized(response, "Session no longer valid.");
                return;
            }

            User user = userOpt.get();
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase()));
            var authentication = new UsernamePasswordAuthenticationToken(
                    new AuthenticatedUser(user.getId(), user.getRole().name()), null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            chain.doFilter(request, response);
        } catch (JwtException ex) {
            writeUnauthorized(response, "Invalid or expired access token.");
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(message, null, null));
    }

    public record AuthenticatedUser(String userId, String role) {}
}
