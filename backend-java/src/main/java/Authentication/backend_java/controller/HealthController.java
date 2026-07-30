package Authentication.backend_java.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public HealthBody health() {
        return new HealthBody(true);
    }

    public record HealthBody(boolean ok) {}
}
