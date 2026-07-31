package Authentication.backend_java.config;

import java.util.ArrayList;
import java.util.Map;

import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientProperties;
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientPropertiesMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

@Configuration
public class OAuth2ClientConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(OAuth2ClientProperties properties) {
        properties.getRegistration().entrySet().removeIf(entry -> {
            OAuth2ClientProperties.Registration reg = entry.getValue();
            return !hasText(reg.getClientId()) || !hasText(reg.getClientSecret());
        });

        if (properties.getRegistration().isEmpty()) {
            return registrationId -> null;
        }

        Map<String, ClientRegistration> registrations =
                new OAuth2ClientPropertiesMapper(properties).asClientRegistrations();
        return new InMemoryClientRegistrationRepository(new ArrayList<>(registrations.values()));
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}