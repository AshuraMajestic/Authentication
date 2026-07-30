package Authentication.backend_java.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import Authentication.backend_java.config.AppProperties;
import Authentication.backend_java.model.Otp;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    public MailService(JavaMailSender mailSender, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    private boolean smtpConfigured() {
        return smtpHost != null && !smtpHost.isBlank();
    }

    public void sendOtpEmail(String to, String code, Otp.OtpPurpose purpose) {
        String subject = purpose == Otp.OtpPurpose.signup
                ? "Confirm your SecureGate account"
                : "Your SecureGate sign-in code";
        String body = "Your one-time code is " + code + ". It expires in "
                + appProperties.getOtp().getTtlMinutes()
                + " minutes. If you didn't request this, you can ignore this email.";

        if (!smtpConfigured()) {
            log.info("[mailer] (no SMTP configured) OTP for {}: {}", to, code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(appProperties.getMail().getFrom());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    /** Mirrors canEchoOtpInResponse(): only leak the code in the API response outside prod, and only when there's no real mailer. */
    public boolean canEchoOtpInResponse() {
        return !appProperties.isProd() && !smtpConfigured();
    }
}
