package in.thecreatestudio.backend.mail;

import in.thecreatestudio.backend.config.AppProperties;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails over SMTP. If SMTP is not configured (MAIL_HOST empty),
 * sending is skipped and {@code false} is returned so callers can tell the admin to share
 * the link manually — we never pretend an email was sent.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    public record Attachment(String filename, byte[] data, String contentType) {}

    private final ObjectProvider<JavaMailSender> sender;
    private final AppProperties props;
    private final Environment env;

    public MailService(ObjectProvider<JavaMailSender> sender, AppProperties props, Environment env) {
        this.sender = sender;
        this.props = props;
        this.env = env;
    }

    public boolean isConfigured() {
        String host = env.getProperty("spring.mail.host");
        String password = env.getProperty("spring.mail.password");
        boolean passwordSet = password != null && !password.isBlank() && !password.startsWith("PASTE_") && !password.startsWith("your-");
        return host != null && !host.isBlank() && passwordSet
                && props.mailFrom() != null && !props.mailFrom().isBlank()
                && sender.getIfAvailable() != null;
    }

    /** @return true only if the SMTP server accepted the message. */
    public boolean send(List<String> to, String subject, String html, Attachment attachment) {
        if (!isConfigured()) {
            log.info("Email not sent (SMTP not configured): '{}' to {}", subject, to);
            return false;
        }
        try {
            JavaMailSender mailSender = sender.getObject();
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, attachment != null, "UTF-8");
            h.setFrom(props.mailFrom(), props.companyName());
            h.setTo(to.toArray(String[]::new));
            h.setSubject(subject);
            h.setText(html, true);
            if (attachment != null) {
                h.addAttachment(attachment.filename(), new ByteArrayResource(attachment.data()), attachment.contentType());
            }
            mailSender.send(msg);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, to, e);
            return false;
        }
    }

    /** Minimal branded HTML wrapper for emails. */
    public String layout(String heading, String bodyHtml, String buttonText, String buttonUrl) {
        String button = buttonUrl == null ? "" :
                "<p style=\"margin:28px 0\"><a href=\"" + esc(buttonUrl) + "\" style=\"background:#ffe01b;color:#082226;"
                + "padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:700\">" + esc(buttonText) + "</a></p>"
                + "<p style=\"font-size:12px;color:#667\">Or open this link: " + esc(buttonUrl) + "</p>";
        return "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2a2c\">"
                + "<div style=\"background:#0a434b;padding:18px 24px;border-radius:12px 12px 0 0\">"
                + "<span style=\"background:#ffe01b;color:#082226;font-weight:800;padding:3px 7px;border-radius:5px\">THE</span>"
                + "<span style=\"color:#fff;font-weight:800;margin-left:8px\">CREATE STUDIO</span></div>"
                + "<div style=\"border:1px solid #e3e8e9;border-top:0;padding:24px;border-radius:0 0 12px 12px\">"
                + "<h2 style=\"margin-top:0;color:#0a434b\">" + esc(heading) + "</h2>" + bodyHtml + button + "</div></div>";
    }

    public static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
