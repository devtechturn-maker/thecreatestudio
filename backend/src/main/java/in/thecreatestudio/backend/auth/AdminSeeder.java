package in.thecreatestudio.backend.auth;

import in.thecreatestudio.backend.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD when the table is empty. */
@Component
class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AdminUserRepository repo;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    AdminSeeder(AdminUserRepository repo, PasswordEncoder encoder, AppProperties props) {
        this.repo = repo;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return;
        var admin = props.admin();
        if (admin == null || isBlank(admin.email()) || isBlank(admin.password())) {
            log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD and restart to create one.");
            return;
        }
        if (admin.password().length() < 10) {
            log.warn("ADMIN_PASSWORD must be at least 10 characters — admin account not created.");
            return;
        }
        repo.save(new AdminUser(admin.email(), encoder.encode(admin.password()), props.ownerSignerName()));
        log.info("Created initial admin account for {}", admin.email());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
