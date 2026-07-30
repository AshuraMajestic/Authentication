package Authentication.backend_java.dto.response;


public class AuthResponse {
    private UserResponse user;
    private String accessToken;

    public AuthResponse(UserResponse user, String accessToken) {
        this.user = user;
        this.accessToken = accessToken;
    }

    public UserResponse getUser() { return user; }
    public String getAccessToken() { return accessToken; }
}
