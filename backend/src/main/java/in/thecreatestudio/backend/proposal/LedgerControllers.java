package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.proposal.PaymentEntry.Method;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin payment tracking (JWT required, see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
class AdminLedgerController {

    record RecordRequest(@NotNull UUID id,
                         @NotNull Method method,
                         @Min(1) @Max(100_000_000_000L) long amountPaise,
                         @NotNull LocalDate paidOn,
                         @Size(max = 120) String reference,
                         @Size(max = 500) String note) {}

    record CancelRequest(@NotBlank @Size(max = 300) String reason) {}

    record DueRequest(@NotNull @Min(0) @Max(100_000_000_000L) Long amountPaise,
                      LocalDate dueDate,
                      @Size(max = 300) String note) {}

    private final LedgerService ledger;
    private final PaymentOverviewService overview;

    AdminLedgerController(LedgerService ledger, PaymentOverviewService overview) {
        this.ledger = ledger;
        this.overview = overview;
    }

    @GetMapping("/payments")
    PaymentOverviewService.Overview overview() {
        return overview.overview();
    }

    @GetMapping("/proposals/{id}/account")
    LedgerService.Account account(@PathVariable UUID id) {
        return ledger.account(id);
    }

    @PostMapping("/proposals/{id}/payments")
    LedgerService.Account record(@PathVariable UUID id, @Valid @RequestBody RecordRequest body,
                                 @AuthenticationPrincipal Jwt jwt, HttpServletRequest req) {
        ledger.recordPayment(id, body.id(), body.method(), body.amountPaise(), body.paidOn(), body.reference(), body.note(),
                jwt.getClaimAsString("email"), ClientInfo.from(req));
        return ledger.account(id);
    }

    @PostMapping("/proposals/{id}/payments/{entryId}/cancel")
    LedgerService.Account cancel(@PathVariable UUID id, @PathVariable UUID entryId, @Valid @RequestBody CancelRequest body,
                                 @AuthenticationPrincipal Jwt jwt, HttpServletRequest req) {
        ledger.cancelEntry(id, entryId, body.reason(), jwt.getClaimAsString("email"), ClientInfo.from(req));
        return ledger.account(id);
    }

    @PutMapping("/proposals/{id}/due")
    LedgerService.Account due(@PathVariable UUID id, @Valid @RequestBody DueRequest body, HttpServletRequest req) {
        ledger.requestPayment(id, body.amountPaise(), body.dueDate(), body.note(), ClientInfo.from(req));
        return ledger.account(id);
    }

    @PostMapping("/proposals/{id}/payment-update")
    Map<String, Object> emailUpdate(@PathVariable UUID id, HttpServletRequest req) {
        ledger.emailUpdate(id, ClientInfo.from(req));
        return Map.of("emailSent", true);
    }
}

/** The client's own payment summary, gated by the token in their link. */
@RestController
@RequestMapping("/api/public/proposals/{token}/account")
class PublicLedgerController {

    private final LedgerService ledger;

    PublicLedgerController(LedgerService ledger) {
        this.ledger = ledger;
    }

    @GetMapping
    ResponseEntity<LedgerService.ClientAccount> account(@PathVariable String token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ledger.clientAccount(token));
    }
}
