package Authentication.backend_java.dto.request;

import jakarta.validation.constraints.NotNull;

public class UpdateRoleRequest {

    @NotNull(message = "Role must be 'user' or 'manager'.")
    private String role;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
