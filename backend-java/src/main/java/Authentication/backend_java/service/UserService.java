package Authentication.backend_java.service;


import org.springframework.stereotype.Service;

import Authentication.backend_java.model.AuthProvider;
import Authentication.backend_java.model.Role;
import Authentication.backend_java.model.User;
import Authentication.backend_java.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Mirrors config/passport.ts findOrCreateOAuthUser. */
    public User findOrCreateOAuthUser(AuthProvider provider, String providerId, String email, String name) {
        return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> {
                    if (email != null && !email.isBlank()) {
                        var byEmail = userRepository.findByEmail(email.toLowerCase()).orElse(null);
                        if (byEmail != null) {
                            byEmail.setProvider(provider);
                            byEmail.setProviderId(providerId);
                            byEmail.setEmailVerified(true);
                            return userRepository.save(byEmail);
                        }
                    }

                    User created = new User();
                    created.setName(name);
                    created.setEmail(email != null && !email.isBlank()
                            ? email.toLowerCase()
                            : provider.name() + "_" + providerId + "@no-email.securegate.dev");
                    created.setRole(Role.user);
                    created.setProvider(provider);
                    created.setProviderId(providerId);
                    created.setAvatarInitials(User.initialsFromName(name));
                    created.setEmailVerified(email != null && !email.isBlank());
                    return userRepository.save(created);
                });
    }
}
