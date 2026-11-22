package in.thecreatestudio.backend.mail;

import in.thecreatestudio.backend.config.AppProperties;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.MessagingException;
import jakarta.mail.SendFailedException;
import jakarta.mail.internet.MimeMessage;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
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

    /** Outcome of a send. {@code error} is safe to show to the admin (never contains credentials). */
    public record Result(boolean sent, String error) {}

    /** @return what is missing from the server's email settings, or null when email can be used. */
    public String configurationProblem() {
        if (blank(env.getProperty("spring.mail.host"))) return "MAIL_HOST is empty on the server.";
        if (blank(env.getProperty("spring.mail.username"))) return "MAIL_USERNAME is empty on the server.";
        String password = env.getProperty("spring.mail.password");
        if (blank(password) || password.startsWith("PASTE_") || password.startsWith("your-")) {
            return "MAIL_PASSWORD is empty or still the placeholder on the server.";
        }
        if (sender.getIfAvailable() == null) return "The mail sender could not start.";
        return null;
    }

    public boolean isConfigured() {
        return configurationProblem() == null;
    }

    /** MAIL_FROM, or the SMTP login when that is left empty (Gmail requires them to match anyway). */
    public String fromAddress() {
        return blank(props.mailFrom()) ? env.getProperty("spring.mail.username", "") : props.mailFrom();
    }

    /** Successful only if the SMTP server accepted the message. */
    public Result send(List<String> to, String subject, String text, String html, Attachment attachment) {
        String problem = configurationProblem();
        if (problem != null) {
            log.info("Email '{}' not sent: {}", subject, problem);
            return new Result(false, problem);
        }
        try {
            JavaMailSender mailSender = sender.getObject();
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromAddress(), props.companyName());
            h.setTo(to.toArray(String[]::new));
            h.setSubject(subject);
            h.setText(text, html); // plain-text part as well: HTML-only mail is more likely to be marked as spam
            if (attachment != null) {
                h.addAttachment(attachment.filename(), new ByteArrayResource(attachment.data()), attachment.contentType());
            }
            mailSender.send(msg);
            return new Result(true, null);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, to, e);
            return new Result(false, describe(e));
        }
    }

    /** Turns an SMTP failure into something the admin can act on. */
    static String describe(Exception failure) {
        List<Throwable> chain = new ArrayList<>();
        collect(failure, chain);
        if (has(chain, MailAuthenticationException.class) || has(chain, AuthenticationFailedException.class)) {
            return "The mail server rejected the login. Create a new Gmail App Password, put it in MAIL_PASSWORD "
                    + "without spaces, then restart the backend.";
        }
        if (has(chain, UnknownHostException.class)) return "The mail server address was not found. Check MAIL_HOST.";
        if (has(chain, SocketTimeoutException.class)) return "The mail server did not answer in time. Try again in a minute.";
        if (has(chain, ConnectException.class)) {
            return "The server could not connect to the mail server. Check MAIL_PORT (587) and the hosting firewall.";
        }
        if (has(chain, SendFailedException.class)) return "The mail server refused the recipient. Check the client's email address.";
        Throwable last = chain.get(chain.size() - 1);
        String detail = String.valueOf(last.getMessage()).replaceAll("\\s+", " ").trim();
        return "The mail server refused the message: " + detail.substring(0, Math.min(detail.length(), 180));
    }

    private static void collect(Throwable t, List<Throwable> out) {
        if (t == null || out.contains(t)) return;
        out.add(t);
        // Both of these keep the real cause somewhere other than getCause().
        if (t instanceof MailSendException m) for (Exception e : m.getMessageExceptions()) collect(e, out);
        if (t instanceof MessagingException m) collect(m.getNextException(), out);
        collect(t.getCause(), out);
    }

    private static boolean has(List<Throwable> chain, Class<? extends Throwable> type) {
        return chain.stream().anyMatch(type::isInstance);
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
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
