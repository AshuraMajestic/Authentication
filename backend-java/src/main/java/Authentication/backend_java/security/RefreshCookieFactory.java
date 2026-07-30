package Authentication.backend_java.security;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import Authentication.backend_java.config.AppProperties;

@Component
public class RefreshCookieFactory {

    public static final String COOKIE_NAME = "sg_refresh";

    private final AppProperties appProperties;

    public RefreshCookieFactory(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public ResponseCookie build(String rawToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(appProperties.isProd())
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofDays(appProperties.getJwt().getRefreshTokenTtlDays()));

        if (appProperties.getCookieDomain() != null && !appProperties.getCookieDomain().isBlank()) {
            builder.domain(appProperties.getCookieDomain());
        }
        return builder.build();
    }

    /** Same attributes but immediately expired, for clearing the cookie on logout / invalid refresh. */
    public ResponseCookie clear() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(appProperties.isProd())
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ZERO);

        if (appProperties.getCookieDomain() != null && !appProperties.getCookieDomain().isBlank()) {
            builder.domain(appProperties.getCookieDomain());
        }
        return builder.build();
    }
}
