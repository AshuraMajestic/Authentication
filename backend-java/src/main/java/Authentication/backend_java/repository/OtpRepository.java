package Authentication.backend_java.repository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import Authentication.backend_java.config.AppProperties;
import Authentication.backend_java.model.Otp;

public interface OtpRepository extends MongoRepository<Otp, String> {

    List<AppProperties.Otp> findAllByEmailAndPurposeAndConsumedAtIsNull(String email, Otp.OtpPurpose purpose);

    Optional<Otp> findFirstByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email, Otp.OtpPurpose purpose);

    Optional<Otp> findFirstByEmailAndConsumedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, Instant now);
}
