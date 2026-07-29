package Authentication.backend_java.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String env = "development";
    private String frontendUrl = "http://localhost:5173";
    private String cookieDomain;

    private final Jwt jwt = new Jwt();
    private final Otp otp = new Otp();
    private final Mail mail = new Mail();
    private final Admin admin = new Admin();

    public boolean isProd() {
        return "production".equalsIgnoreCase(env);
    }

    public String getEnv() { return env; }
    public void setEnv(String env) { this.env = env; }

    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String frontendUrl) { this.frontendUrl = frontendUrl; }

    public String getCookieDomain() { return cookieDomain; }
    public void setCookieDomain(String cookieDomain) { this.cookieDomain = cookieDomain; }

    public Jwt getJwt() { return jwt; }
    public Otp getOtp() { return otp; }
    public Mail getMail() { return mail; }
    public Admin getAdmin() { return admin; }

    public static class Jwt {
        private String accessTokenSecret;
        private int accessTokenTtlMinutes = 15;
        private int refreshTokenTtlDays = 30;

        public String getAccessTokenSecret() { return accessTokenSecret; }
        public void setAccessTokenSecret(String accessTokenSecret) { this.accessTokenSecret = accessTokenSecret; }
        public int getAccessTokenTtlMinutes() { return accessTokenTtlMinutes; }
        public void setAccessTokenTtlMinutes(int accessTokenTtlMinutes) { this.accessTokenTtlMinutes = accessTokenTtlMinutes; }
        public int getRefreshTokenTtlDays() { return refreshTokenTtlDays; }
        public void setRefreshTokenTtlDays(int refreshTokenTtlDays) { this.refreshTokenTtlDays = refreshTokenTtlDays; }
    }

    public static class Otp {
        private int ttlMinutes = 5;
        private int maxAttempts = 5;

        public int getTtlMinutes() { return ttlMinutes; }
        public void setTtlMinutes(int ttlMinutes) { this.ttlMinutes = ttlMinutes; }
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
    }

    public static class Mail {
        private String from = "SecureGate <no-reply@securegate.dev>";

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
    }

    public static class Admin {
        private String seedEmail;
        private String seedPassword;
        private String seedName = "Admin";

        public String getSeedEmail() { return seedEmail; }
        public void setSeedEmail(String seedEmail) { this.seedEmail = seedEmail; }
        public String getSeedPassword() { return seedPassword; }
        public void setSeedPassword(String seedPassword) { this.seedPassword = seedPassword; }
        public String getSeedName() { return seedName; }
        public void setSeedName(String seedName) { this.seedName = seedName; }
    }
}
