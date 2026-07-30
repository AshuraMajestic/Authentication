package Authentication.backend_java.service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Authentication.backend_java.dto.request.LoginRequest;
import Authentication.backend_java.dto.request.ResendOtpRequest;
import Authentication.backend_java.dto.request.SignupRequest;
import Authentication.backend_java.dto.request.VerifyOtpRequest;
import Authentication.backend_java.dto.response.OtpSentResponse;
import Authentication.backend_java.dto.response.UserResponse;
import Authentication.backend_java.exception.ApiException;
import Authentication.backend_java.model.Otp;
import Authentication.backend_java.model.Role;
import Authentication.backend_java.model.User;
import Authentication.backend_java.repository.UserRepository;
import Authentication.backend_java.security.JwtService;
import Authentication.backend_java.security.RefreshTokenService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final MailService mailService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, OtpService otpService, MailService mailService,
                        JwtService jwtService, RefreshTokenService refreshTokenService,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.mailService = mailService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    public record SessionResult(UserResponse user, String accessToken, String refreshToken) {}
    public record RefreshResult(String accessToken, String refreshToken) {}

    public OtpSentResponse signup(SignupRequest req) {
        String email = req.getEmail().toLowerCase();

        userRepository.findByEmail(email).ifPresent(u -> {
            throw ApiException.conflict("An account with that email already exists. Try signing in instead.");
        });

        User user = new User();
        user.setName(req.getName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.user);
        user.setAvatarInitials(User.initialsFromName(req.getName()));
        userRepository.save(user);

        String code = otpService.createOtp(email, Otp.OtpPurpose.signup);
        mailService.sendOtpEmail(email, code, Otp.OtpPurpose.signup);

        return new OtpSentResponse(email, mailService.canEchoOtpInResponse() ? code : null);
    }

    public OtpSentResponse login(LoginRequest req) {
        String email = req.getEmail().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("No account with that email yet. Create one instead?"));

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Incorrect password.");
        }

        String code = otpService.createOtp(email, Otp.OtpPurpose.login);
        mailService.sendOtpEmail(email, code, Otp.OtpPurpose.login);

        return new OtpSentResponse(email, mailService.canEchoOtpInResponse() ? code : null);
    }

    
    public SessionResult verifyOtpAndLogin(VerifyOtpRequest req) {
        String email = req.getEmail().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("No account with that email."));

        Otp.OtpPurpose purpose = otpService.getPendingOtpPurpose(email)
                .orElseThrow(() -> ApiException.badRequest("No pending code for this email. Start again."));

        otpService.verifyOtp(email, purpose, req.getCode());

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        return buildSession(user);
    }

    /** POST /api/auth/otp/resend */
    public OtpSentResponse resendOtp(ResendOtpRequest req) {
        String email = req.getEmail().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("Unknown account."));

        Otp.OtpPurpose purpose = otpService.getPendingOtpPurpose(email)
                .orElse(user.isEmailVerified() ? Otp.OtpPurpose.login : Otp.OtpPurpose.signup);

        String code = otpService.createOtp(email, purpose);
        mailService.sendOtpEmail(email, code, purpose);

        return new OtpSentResponse(null, mailService.canEchoOtpInResponse() ? code : null);
    }

    /** POST /api/auth/refresh — rotates the refresh token and mints a new access token. */
    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw ApiException.unauthorized("No refresh token.");
        }

        var rotated = refreshTokenService.rotate(rawRefreshToken)
                .orElseThrow(() -> ApiException.unauthorized("Session expired. Please sign in again."));

        User user = userRepository.findById(rotated.userId())
                .orElseThrow(() -> ApiException.unauthorized("Session no longer valid."));

        return new RefreshResult(jwtService.signAccessToken(user), rotated.newRawToken());
    }

    /** POST /api/auth/logout */
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    /** GET /api/auth/me */
    public UserResponse me(String userId) {
        User user = userRepository.findById(userId).orElseThrow(ApiException::unauthorized);
        return UserResponse.from(user);
    }

    public SessionResult buildSession(User user) {
        String accessToken = jwtService.signAccessToken(user);
        String refreshToken = refreshTokenService.issueRefreshToken(user.getId());
        return new SessionResult(UserResponse.from(user), accessToken, refreshToken);
    }
}
