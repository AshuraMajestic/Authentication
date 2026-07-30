package Authentication.backend_java.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpSentResponse {
    private String otpSentTo;
    private String devOtpHint;

    public OtpSentResponse(String otpSentTo, String devOtpHint) {
        this.otpSentTo = otpSentTo;
        this.devOtpHint = devOtpHint;
    }

    public String getOtpSentTo() { return otpSentTo; }
    public String getDevOtpHint() { return devOtpHint; }
}
