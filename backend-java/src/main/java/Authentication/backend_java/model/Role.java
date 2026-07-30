package Authentication.backend_java.model;

public enum Role {
    user,
    manager,
    admin;

    /** Roles that can be granted through the admin API (admin is DB-only, like the original). */
    public static boolean isPromotable(Role role) {
        return role == user || role == manager;
    }
}
