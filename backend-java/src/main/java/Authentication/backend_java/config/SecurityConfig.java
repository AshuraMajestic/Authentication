package Authentication.backend_java.config;

import java.time.Duration;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import Authentication.backend_java.exception.ErrorResponse;
import Authentication.backend_java.filter.RateLimitFilter;
import Authentication.backend_java.repository.UserRepository;
import Authentication.backend_java.security.JwtAuthenticationFilter;
import Authentication.backend_java.security.JwtService;
import Authentication.backend_java.security.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AppProperties appProperties;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    public SecurityConfig(AppProperties appProperties, JwtService jwtService, UserRepository userRepository,
                           OAuth2SuccessHandler oAuth2SuccessHandler) {
        this.appProperties = appProperties;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();

        http
                .csrf(csrf -> csrf.disable()) // stateless bearer-token API; cookie is httpOnly + SameSite=Lax
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        .contentTypeOptions(c -> {})
                        .frameOptions(frame -> frame.deny())
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/otp/verify",
                                "/api/auth/otp/resend", "/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/auth/oauth/**", "/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/manager/overview").hasAnyRole("ADMIN", "MANAGER")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), new ErrorResponse("Unauthorized", null, null));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(),
                                    new ErrorResponse("You don't have access to this resource.", null, null));
                        })
                )
                .oauth2Login(oauth2 -> oauth2
                        // Keeps the same public paths as the original Express app:
                        // GET /api/auth/oauth/google (+ /github) to kick off, and
                        // GET /api/auth/oauth/google/callback (+ /github/callback) to complete.
                        .authorizationEndpoint(ep -> ep.baseUri("/api/auth/oauth"))
                        .redirectionEndpoint(ep -> ep.baseUri("/api/auth/oauth/*/callback"))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), new ErrorResponse("OAuth sign-in failed.", null, null));
                        })
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, userRepository),
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter(List.of(
                new RateLimitFilter.Rule("/api/auth/signup", Duration.ofMinutes(15), 20),
                new RateLimitFilter.Rule("/api/auth/login", Duration.ofMinutes(15), 20),
                new RateLimitFilter.Rule("/api/auth/otp/verify", Duration.ofMinutes(10), 15),
                new RateLimitFilter.Rule("/api/auth/otp/resend", Duration.ofMinutes(10), 15)
        ));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(appProperties.getFrontendUrl()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
