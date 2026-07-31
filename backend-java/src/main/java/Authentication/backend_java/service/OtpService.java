package Authentication.backend_java.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Authentication.backend_java.config.AppProperties;
import Authentication.backend_java.exception.ApiException;
import Authentication.backend_java.model.Otp;
import Authentication.backend_java.repository.OtpRepository;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final AppProperties appProperties;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpRepository otpRepository, AppProperties appProperties, PasswordEncoder passwordEncoder) {
        this.otpRepository = otpRepository;
        this.appProperties = appProperties;
        this.passwordEncoder = passwordEncoder;
    }

    private String generateCode() {
        // 100000-999999 inclusive, unbiased.
        int code = 100000 + secureRandom.nextInt(900000);
        return Integer.toString(code);
    }

    /** Creates (or replaces) the pending OTP for an email + purpose, returns the plaintext code to send. */
    public String createOtp(String email, Otp.OtpPurpose purpose) {
        String normalizedEmail = email.toLowerCase();
        String code = generateCode();
        String codeHash = passwordEncoder.encode(code);
        Instant expiresAt = Instant.now().plus(appProperties.getOtp().getTtlMinutes(), ChronoUnit.MINUTES);

        otpRepository.findAllByEmailAndPurposeAndConsumedAtIsNull(normalizedEmail, purpose)
                .forEach(otpRepository::delete);

        Otp otp = new Otp();
        otp.setEmail(normalizedEmail);
        otp.setPurpose(purpose);
        otp.setCodeHash(codeHash);
        otp.setExpiresAt(expiresAt);
        otpRepository.save(otp);

        return code;
    }

    /** Returns which purpose currently has a pending, unconsumed code for this email, if any. */
    public Optional<Otp.OtpPurpose> getPendingOtpPurpose(String email) {
        return otpRepository
                .findFirstByEmailAndConsumedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        email.toLowerCase(), Instant.now())
                .map(Otp::getPurpose);
    }

    public void verifyOtp(String email, Otp.OtpPurpose purpose, String submittedCode) {
        String normalizedEmail = email.toLowerCase();
        Otp record = otpRepository
                .findFirstByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(normalizedEmail, purpose)
                .orElseThrow(() -> ApiException.badRequest("No pending code for this email. Start again."));

        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("This code expired. Request a new one.");
        }
        if (record.getAttempts() >= appProperties.getOtp().getMaxAttempts()) {
            throw ApiException.badRequest("Too many incorrect attempts. Request a new code.");
        }

        if (!passwordEncoder.matches(submittedCode.trim(), record.getCodeHash())) {
            record.setAttempts(record.getAttempts() + 1);
            otpRepository.save(record);
            throw ApiException.badRequest("That code doesn't match.");
        }

        record.setConsumedAt(Instant.now());
        otpRepository.save(record);
    }
}
