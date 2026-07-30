package Authentication.backend_java.security;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.stereotype.Service;

import Authentication.backend_java.config.AppProperties;
import Authentication.backend_java.model.RefreshToken;
import Authentication.backend_java.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AppProperties appProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, AppProperties appProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.appProperties = appProperties;
    }

    public record RotationResult(String userId, String newRawToken) {}

    /** Issues a brand-new refresh token for the given user and returns the raw (unhashed) value. */
    public String issueRefreshToken(String userId) {
        String raw = generateRawToken();
        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setTokenHash(hash(raw));
        token.setExpiresAt(expiryFromNow());
        refreshTokenRepository.save(token);
        return raw;
    }

    /** Validates + rotates a raw refresh token. Returns empty if the token is missing, revoked, or expired. */
    public Optional<RotationResult> rotate(String rawToken) {
        Optional<RefreshToken> existingOpt = refreshTokenRepository.findByTokenHash(hash(rawToken));
        if (existingOpt.isEmpty()) return Optional.empty();

        RefreshToken existing = existingOpt.get();
        if (existing.getRevokedAt() != null || existing.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        String newRaw = generateRawToken();
        String newHash = hash(newRaw);

        existing.setRevokedAt(Instant.now());
        existing.setReplacedByTokenHash(newHash);
        refreshTokenRepository.save(existing);

        RefreshToken next = new RefreshToken();
        next.setUserId(existing.getUserId());
        next.setTokenHash(newHash);
        next.setExpiresAt(expiryFromNow());
        refreshTokenRepository.save(next);

        return Optional.of(new RotationResult(existing.getUserId(), newRaw));
    }

    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    public void revokeAllForUser(String userId) {
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId).forEach(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    private Instant expiryFromNow() {
        return Instant.now().plus(appProperties.getJwt().getRefreshTokenTtlDays(), ChronoUnit.DAYS);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes());
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
