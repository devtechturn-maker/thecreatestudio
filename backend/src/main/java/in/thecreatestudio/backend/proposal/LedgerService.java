package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.mail.MailService;
import in.thecreatestudio.backend.proposal.PaymentEntry.Method;
import in.thecreatestudio.backend.proposal.ProposalEvent.Actor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The single source of truth for money received and money due.
 * All payments are entered by the admin. Every write locks the proposal row first, so two entries
 * saved together cannot both be counted against the same balance.
 */
@Service
public class LedgerService {

    public record EntryView(UUID id, Method method, long amountPaise, LocalDate paidOn, String reference, String note,
                            boolean testMode, String recordedBy, Instant createdAt, Instant voidedAt, String voidedBy,
                            String voidReason) {}

    /** What the client may see: no internal notes, admin emails or cancelled entries. */
    public record ClientEntry(Method method, long amountPaise, LocalDate paidOn, String reference, boolean testMode) {}

    public record Balance(long totalPaise, long paidPaise, long onlinePaise, long offlinePaise, long balancePaise,
                          long overpaidPaise, long dueNowPaise, LocalDate dueDate, String dueNote, boolean overdue) {}

    public record Account(Balance balance, List<EntryView> entries) {}

    public record ClientAccount(Balance balance, List<ClientEntry> entries) {}

    private final ProposalRepository proposals;
    private final PaymentEntryRepository entries;
    private final ProposalService proposalService;
    private final MailService mail;

    LedgerService(ProposalRepository proposals, PaymentEntryRepository entries, ProposalService proposalService,
                  MailService mail) {
        this.proposals = proposals;
        this.entries = entries;
        this.proposalService = proposalService;
        this.mail = mail;
    }

    // ------------------------------------------------------------------ reading

    @Transactional(readOnly = true)
    public Account account(UUID id) {
        Proposal p = proposalService.get(id);
        List<PaymentEntry> all = entries.findByProposalIdOrderByPaidOnDescCreatedAtDesc(id);
        return new Account(balance(p, all), all.stream().map(e -> new EntryView(e.getId(), e.getMethod(),
                e.getAmountPaise(), e.getPaidOn(), e.getReference(), e.getNote(), e.isTestMode(), e.getRecordedBy(),
                e.getCreatedAt(), e.getVoidedAt(), e.getVoidedBy(), e.getVoidReason())).toList());
    }

    @Transactional(readOnly = true)
    public ClientAccount clientAccount(String token) {
        Proposal p = proposalService.byToken(token);
        List<PaymentEntry> all = entries.findByProposalIdOrderByPaidOnDescCreatedAtDesc(p.getId());
        return new ClientAccount(balance(p, all), all.stream().filter(PaymentEntry::active).map(e -> new ClientEntry(
                e.getMethod(), e.getAmountPaise(), e.getPaidOn(), e.getReference(), e.isTestMode())).toList());
    }

    static Balance balance(Proposal p, List<PaymentEntry> all) {
        long paid = 0, online = 0;
        for (PaymentEntry e : all) {
            if (!e.active()) continue;
            paid += e.getAmountPaise();
            switch (e.getMethod()) {
                case ONLINE, UPI, BANK_TRANSFER -> online += e.getAmountPaise();
                case CASH, CHEQUE, OTHER -> { }
            }
        }
        long due = p.dueNow(paid);
        return new Balance(p.getAmountPaise(), paid, online, paid - online, Math.max(p.getAmountPaise() - paid, 0),
                Math.max(paid - p.getAmountPaise(), 0), due, due > 0 ? p.getDueDate() : null,
                due > 0 ? p.getDueNote() : null,
                due > 0 && p.getDueDate() != null && p.getDueDate().isBefore(today()));
    }

    // ------------------------------------------------------------------ admin writes

    /** @param entryId chosen by the browser, so a double tap or a retry records the money only once. */
    @Transactional
    public void recordPayment(UUID id, UUID entryId, Method method, long amountPaise, LocalDate paidOn, String reference,
                              String note, String admin, ClientInfo info) {
        Proposal p = lock(id);
        PaymentEntry existing = entries.findById(entryId).orElse(null);
        if (existing != null) {
            boolean sameRequest = existing.getProposalId().equals(id) && existing.getMethod() == method
                    && existing.getAmountPaise() == amountPaise && Objects.equals(existing.getPaidOn(), paidOn);
            if (sameRequest) return;
            throw ApiException.conflict("This payment was already recorded with different details. Reload and check the history.");
        }
        if (p.getStatus() == ProposalStatus.DRAFT || p.getStatus() == ProposalStatus.CANCELLED) {
            throw ApiException.conflict("Send the proposal before recording payments.");
        }
        if (paidOn.isAfter(today())) throw ApiException.badRequest("The payment date cannot be in the future.");
        if (paidOn.getYear() < 2000) throw ApiException.badRequest("Check the payment date.");
        long paid = entries.totalReceived(id);
        long balance = Math.max(p.getAmountPaise() - paid, 0);
        if (amountPaise > balance) {
            throw ApiException.conflict("That is more than the balance of " + PdfService.formatMoney(balance, p.getCurrency()) + ".");
        }
        entries.save(new PaymentEntry(entryId, id, method, amountPaise, paidOn, trim(reference), trim(note), admin));
        p.syncPaid(paid + amountPaise);
        proposalService.logEvent(id, "PAYMENT_RECORDED", Actor.ADMIN, info,
                PdfService.formatMoney(amountPaise, p.getCurrency()) + " by " + method.label() + " on " + paidOn + " (" + admin + ")");
    }

    @Transactional
    public void cancelEntry(UUID id, UUID entryId, String reason, String admin, ClientInfo info) {
        Proposal p = lock(id);
        PaymentEntry e = entries.findById(entryId).filter(x -> x.getProposalId().equals(id))
                .orElseThrow(() -> ApiException.notFound("Payment"));
        if (!e.active()) throw ApiException.conflict("This payment is already cancelled.");
        e.cancel(admin, reason.trim());
        entries.flush();
        p.syncPaid(entries.totalReceived(id));
        proposalService.logEvent(id, "PAYMENT_CANCELLED", Actor.ADMIN, info,
                PdfService.formatMoney(e.getAmountPaise(), p.getCurrency()) + " by " + e.getMethod().label() + ": " + reason.trim());
    }

    /** Sets how much the client should pay now. Zero stops asking; the overall balance stays. */
    @Transactional
    public void requestPayment(UUID id, long amountPaise, LocalDate dueDate, String note, ClientInfo info) {
        Proposal p = lock(id);
        if (p.getStatus() != ProposalStatus.SIGNED) {
            throw ApiException.conflict("A due amount can only be set on a signed proposal with a balance.");
        }
        long paid = entries.totalReceived(id);
        if (amountPaise > p.getAmountPaise() - paid) throw ApiException.badRequest("The amount due is more than the balance.");
        if (amountPaise > 0 && dueDate != null && dueDate.isBefore(today())) {
            throw ApiException.badRequest("The due date cannot be in the past.");
        }
        p.requestPayment(paid + amountPaise, amountPaise > 0 ? dueDate : null, amountPaise > 0 ? trim(note) : null);
        proposalService.logEvent(id, "DUE_AMOUNT_SET", Actor.ADMIN, info, amountPaise == 0 ? "No payment requested now"
                : PdfService.formatMoney(amountPaise, p.getCurrency()) + (dueDate == null ? "" : " due by " + dueDate));
    }

    // ------------------------------------------------------------------ client updates

    @Transactional(noRollbackFor = ApiException.class)
    public void emailUpdate(UUID id, ClientInfo info) {
        ProposalStatus status = proposalService.get(id).getStatus();
        if (status == ProposalStatus.DRAFT || status == ProposalStatus.CANCELLED) {
            throw ApiException.conflict("Send the proposal before emailing a payment update.");
        }
        MailService.Result r = sendUpdate(id);
        proposalService.logEvent(id, "PAYMENT_UPDATE_EMAIL", Actor.ADMIN, info, r.sent() ? "Sent" : "Failed: " + r.error());
        if (!r.sent()) throw new ApiException(HttpStatus.BAD_GATEWAY, r.error());
    }

    private MailService.Result sendUpdate(UUID id) {
        Proposal p = proposalService.get(id);
        List<PaymentEntry> all = entries.findByProposalIdOrderByPaidOnDescCreatedAtDesc(id);
        Balance b = balance(p, all);
        String url = proposalService.signingUrl(p);

        StringBuilder text = new StringBuilder("Hi " + p.getClientName() + ",\n\nPayment summary for \"" + p.getTitle()
                + "\" (" + p.getNumber() + "):\n");
        StringBuilder rows = new StringBuilder();
        line(text, rows, "Total fee", PdfService.formatMoney(b.totalPaise(), p.getCurrency()));
        line(text, rows, "Paid online, UPI or bank", PdfService.formatMoney(b.onlinePaise(), p.getCurrency()));
        line(text, rows, "Paid by cash, cheque or other", PdfService.formatMoney(b.offlinePaise(), p.getCurrency()));
        line(text, rows, "Total received", PdfService.formatMoney(b.paidPaise(), p.getCurrency()));
        line(text, rows, "Balance", PdfService.formatMoney(b.balancePaise(), p.getCurrency()));
        if (b.dueNowPaise() > 0) {
            line(text, rows, "Due now", PdfService.formatMoney(b.dueNowPaise(), p.getCurrency())
                    + (b.dueDate() == null ? "" : " by " + b.dueDate()));
            if (b.dueNote() != null) line(text, rows, "For", b.dueNote());
        }
        if (all.stream().anyMatch(e -> e.active() && e.isTestMode())) {
            line(text, rows, "Note", "Includes a test payment (no real money)");
        }
        text.append("\nFull payment history: ").append(url);

        return mail.send(List.of(p.getClientEmail()), "Payment update: " + p.getTitle() + " (" + p.getNumber() + ")", text.toString(),
                mail.layout("Payment update", "<p>Hi " + MailService.esc(p.getClientName()) + ", here is the payment summary for <b>"
                        + MailService.esc(p.getTitle()) + "</b>.</p><table cellpadding=\"6\">" + rows + "</table>",
                        "View payments", url), null);
    }

    private static void line(StringBuilder text, StringBuilder rows, String label, String value) {
        text.append(label).append(": ").append(value).append('\n');
        rows.append("<tr><td>").append(MailService.esc(label)).append("</td><td><b>")
                .append(MailService.esc(value)).append("</b></td></tr>");
    }

    private Proposal lock(UUID id) {
        return proposals.findLockedById(id).orElseThrow(() -> ApiException.notFound("Proposal"));
    }

    private static LocalDate today() {
        return LocalDate.now(Proposal.BUSINESS_ZONE);
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
