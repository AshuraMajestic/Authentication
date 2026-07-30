package Authentication.backend_java.dto.response;

import Authentication.backend_java.model.AuthProvider;
import Authentication.backend_java.model.Role;
import Authentication.backend_java.model.User;

public class AdminUserResponse {
    private String id;
    private String name;
    private String email;
    private Role role;
    private AuthProvider provider;

    public static AdminUserResponse from(User user) {
        AdminUserResponse r = new AdminUserResponse();
        r.id = user.getId();
        r.name = user.getName();
        r.email = user.getEmail();
        r.role = user.getRole();
        r.provider = user.getProvider();
        return r;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public AuthProvider getProvider() { return provider; }
}
