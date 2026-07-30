package Authentication.backend_java.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private String error;
    private String code;
    private String detail;

    public ErrorResponse(String error, String code, String detail) {
        this.error = error;
        this.code = code;
        this.detail = detail;
    }

    public String getError() { return error; }
    public String getCode() { return code; }
    public String getDetail() { return detail; }
}
