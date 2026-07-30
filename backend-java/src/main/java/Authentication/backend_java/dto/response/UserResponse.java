package Authentication.backend_java.dto.response;

import Authentication.backend_java.model.AuthProvider;
import Authentication.backend_java.model.Role;
import Authentication.backend_java.model.User;


public class UserResponse {
    private String id;
    private String name;
    private String email;
    private Role role;
    private String avatarInitials;
    private AuthProvider provider;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.id = user.getId();
        r.name = user.getName();
        r.email = user.getEmail();
        r.role = user.getRole();
        r.avatarInitials = user.getAvatarInitials();
        r.provider = user.getProvider();
        return r;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public String getAvatarInitials() { return avatarInitials; }
    public AuthProvider getProvider() { return provider; }
}
