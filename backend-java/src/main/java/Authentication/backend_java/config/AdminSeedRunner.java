package Authentication.backend_java.config;

import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import Authentication.backend_java.repository.UserRepository;

@Component
public class AdminSeedRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeedRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public AdminSeedRunner(UserRepository userRepository, PasswordEncoder passwordEncoder, AppProperties appProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    @Override
    public void run(String... args) {
        String email = appProperties.getAdmin().getSeedEmail();
        String password = appProperties.getAdmin().getSeedPassword();

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }

        String normalizedEmail = email.toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            log.info("Admin seed skipped: an account with {} already exists.", normalizedEmail);
            return;
        }

        String name = appProperties.getAdmin().getSeedName();
        User admin = new User();
        admin.setName(name);
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(Role.admin);
        admin.setAvatarInitials(User.initialsFromName(name));
        admin.setEmailVerified(true);
        userRepository.save(admin);

        log.info("Seeded admin account for {}", normalizedEmail);
    }
}
