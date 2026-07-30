package Authentication.backend_java.filter;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

public class RateLimitFilter extends OncePerRequestFilter {

    public record Rule(String pathPrefix, Duration window, int limit) {}

    private final java.util.List<Rule> rules;
    private final Map<String, Window> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitFilter(java.util.List<Rule> rules) {
        this.rules = rules;
    }

    private static class Window {
        Instant windowStart;
        int count;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        Rule matched = rules.stream().filter(r -> path.startsWith(r.pathPrefix())).findFirst().orElse(null);

        if (matched == null) {
            chain.doFilter(request, response);
            return;
        }

        String key = matched.pathPrefix() + "|" + clientIp(request);
        Instant now = Instant.now();

        Window window = buckets.computeIfAbsent(key, k -> {
            Window w = new Window();
            w.windowStart = now;
            w.count = 0;
            return w;
        });

        synchronized (window) {
            if (Duration.between(window.windowStart, now).compareTo(matched.window()) > 0) {
                window.windowStart = now;
                window.count = 0;
            }
            window.count++;

            if (window.count > matched.limit()) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getWriter(), Map.of("error", "Too many attempts. Try again later."));
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
