package Authentication.backend_java.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import Authentication.backend_java.model.AuthProvider;
import Authentication.backend_java.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
    List<User> findAllByOrderByCreatedAtAsc();
}
