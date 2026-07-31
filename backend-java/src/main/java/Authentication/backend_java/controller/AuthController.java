package Authentication.backend_java.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Authentication.backend_java.dto.request.LoginRequest;
import Authentication.backend_java.dto.request.ResendOtpRequest;
import Authentication.backend_java.dto.request.SignupRequest;
import Authentication.backend_java.dto.request.VerifyOtpRequest;
import Authentication.backend_java.dto.response.AuthResponse;
import Authentication.backend_java.dto.response.OtpSentResponse;
import Authentication.backend_java.dto.response.UserResponse;
import Authentication.backend_java.exception.ApiException;
import Authentication.backend_java.security.JwtAuthenticationFilter;
import Authentication.backend_java.security.RefreshCookieFactory;
import Authentication.backend_java.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshCookieFactory refreshCookieFactory;

    public AuthController(AuthService authService, RefreshCookieFactory refreshCookieFactory) {
        this.authService = authService;
        this.refreshCookieFactory = refreshCookieFactory;
    }

    @PostMapping("/signup")
    public ResponseEntity<OtpSentResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.ok(authService.signup(req));
    }

    @PostMapping("/login")
    public ResponseEntity<OtpSentResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        AuthService.SessionResult session = authService.verifyOtpAndLogin(req);
        return ResponseEntity.ok()
                .header("Set-Cookie", refreshCookieFactory.build(session.refreshToken()).toString())
                .body(new AuthResponse(session.user(), session.accessToken()));
    }

    @PostMapping("/otp/resend")
    public ResponseEntity<OtpSentResponse> resendOtp(@Valid @RequestBody ResendOtpRequest req) {
        return ResponseEntity.ok(authService.resendOtp(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String rawToken = extractRefreshCookie(request);
        try {
            AuthService.RefreshResult result = authService.refresh(rawToken);
            return ResponseEntity.ok()
                    .header("Set-Cookie", refreshCookieFactory.build(result.refreshToken()).toString())
                    .body(new AccessTokenBody(result.accessToken()));
        } catch (ApiException ex) {
            return ResponseEntity.status(ex.getStatus())
                    .header("Set-Cookie", refreshCookieFactory.clear().toString())
                    .body(new Authentication.backend_java.exception.ErrorResponse(ex.getMessage(), ex.getCode(), null));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String rawToken = extractRefreshCookie(request);
        authService.logout(rawToken);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .header("Set-Cookie", refreshCookieFactory.clear().toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeBody> me(@AuthenticationPrincipal JwtAuthenticationFilter.AuthenticatedUser principal) {
        if (principal == null) throw ApiException.unauthorized();
        UserResponse user = authService.me(principal.userId());
        return ResponseEntity.ok(new MeBody(user));
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (RefreshCookieFactory.COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public record AccessTokenBody(String accessToken) {}
    public record MeBody(UserResponse user) {}
}
