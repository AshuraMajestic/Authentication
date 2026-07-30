package Authentication.backend_java.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import Authentication.backend_java.config.AppProperties;
import Authentication.backend_java.model.AuthProvider;
import Authentication.backend_java.model.User;
import Authentication.backend_java.service.AuthService;
import Authentication.backend_java.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Mirrors controllers/oauth.controller.ts: issues our own JWT + refresh cookie, then redirects to the SPA. */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;
    private final AuthService authService;
    private final AppProperties appProperties;
    private final RefreshCookieFactory refreshCookieFactory;

    public OAuth2SuccessHandler(UserService userService, AuthService authService,
                                 AppProperties appProperties, RefreshCookieFactory refreshCookieFactory) {
        this.userService = userService;
        this.authService = authService;
        this.appProperties = appProperties;
        this.refreshCookieFactory = refreshCookieFactory;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId(); // "google" | "github"

        AuthProvider provider = AuthProvider.valueOf(registrationId);
        String providerId;
        String email;
        String name;

        if (provider == AuthProvider.google) {
            providerId = oAuth2User.getAttribute("sub");
            email = oAuth2User.getAttribute("email");
            name = firstNonBlank(oAuth2User.getAttribute("name"), "Google User");
        } else {
            Object idAttr = oAuth2User.getAttribute("id");
            providerId = idAttr != null ? idAttr.toString() : oAuth2User.getName();
            email = oAuth2User.getAttribute("email");
            name = firstNonBlank(oAuth2User.getAttribute("name"), oAuth2User.getAttribute("login"), "GitHub User");
        }

        User user = userService.findOrCreateOAuthUser(provider, providerId, email, name);
        AuthService.SessionResult session = authService.buildSession(user);

        response.addHeader("Set-Cookie", refreshCookieFactory.build(session.refreshToken()).toString());

        String redirectUrl = UriComponentsBuilder
                .fromUriString(appProperties.getFrontendUrl())
                .path("/oauth/callback")
                .queryParam("access_token", session.accessToken())
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
