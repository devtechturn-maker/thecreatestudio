package in.thecreatestudio.backend.auth;

import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
class AuthController {

    record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    record LoginResponse(String token, Instant expiresAt, String name, String email) {}

    record MeResponse(String name, String email) {}

    private final AdminUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final LoginRateLimiter limiter;
    private final AppProperties props;

    AuthController(AdminUserRepository users, PasswordEncoder encoder, JwtEncoder jwtEncoder,
                   LoginRateLimiter limiter, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.jwtEncoder = jwtEncoder;
        this.limiter = limiter;
        this.props = props;
    }

    @PostMapping("/login")
    LoginResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        String ip = ClientInfo.from(http).ip();
        limiter.check(ip);
        AdminUser user = users.findByEmail(req.email().toLowerCase().trim())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            limiter.failure(ip);
            throw new BadCredentialsException("bad credentials");
        }
        limiter.success(ip);

        Instant now = Instant.now();
        Instant exp = now.plus(props.jwt().ttlHours(), ChronoUnit.HOURS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("thecreatestudio")
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("scope", "admin")
                .issuedAt(now)
                .expiresAt(exp)
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return new LoginResponse(token, exp, user.getFullName(), user.getEmail());
    }

    @GetMapping("/me")
    MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new MeResponse(jwt.getClaimAsString("name"), jwt.getClaimAsString("email"));
    }
}
