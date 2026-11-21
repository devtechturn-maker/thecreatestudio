package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.config.AppProperties;
import in.thecreatestudio.backend.mail.MailService;
import in.thecreatestudio.backend.proposal.ProposalEvent.Actor;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProposalService {

    public record SendResult(Proposal proposal, boolean emailSent, String signingUrl) {}

    private final ProposalRepository proposals;
    private final ProposalEventRepository events;
    private final PdfService pdf;
    private final MailService mail;
    private final AppProperties props;

    ProposalService(ProposalRepository proposals, ProposalEventRepository events, PdfService pdf,
                    MailService mail, AppProperties props) {
        this.proposals = proposals;
        this.events = events;
        this.pdf = pdf;
        this.mail = mail;
        this.props = props;
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public Page<Proposal> list(ProposalStatus status, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return status == null ? proposals.findAllByOrderByCreatedAtDesc(pr) : proposals.findByStatusOrderByCreatedAtDesc(status, pr);
    }

    @Transactional(readOnly = true)
    public Proposal get(UUID id) {
        return proposals.findById(id).orElseThrow(() -> ApiException.notFound("Proposal"));
    }

    @Transactional(readOnly = true)
    public List<ProposalEvent> history(UUID id) {
        return events.findByProposalIdOrderByCreatedAtAsc(id);
    }

    @Transactional
    public Proposal create(ProposalContent content, ClientInfo info) {
        // Validate before allocating a number so rejected requests don't leave gaps in the sequence.
        if (content.advancePaise() > content.amountPaise()) throw ApiException.badRequest("Advance cannot be more than the total amount.");
        String number = "TCS-" + Year.now(Proposal.BUSINESS_ZONE) + "-" + String.format("%04d", proposals.nextNumber());
        Proposal p = new Proposal(number);
        p.updateContent(content);
        proposals.save(p);
        log(p, "CREATED", Actor.ADMIN, info, null);
        return p;
    }

    @Transactional
    public Proposal update(UUID id, ProposalContent content, ClientInfo info) {
        Proposal p = get(id);
        boolean wasSigned = p.getOwnerSignature() != null;
        p.updateContent(content);
        log(p, "EDITED", Actor.ADMIN, info, wasSigned ? "Your signature was cleared because the content changed" : null);
        return p;
    }

    @Transactional
    public Proposal ownerSign(UUID id, String signerName, String signature, ClientInfo info) {
        Proposal p = get(id);
        p.ownerSign(signerName.trim(), SignatureImage.validate(signature), info);
        log(p, "OWNER_SIGNED", Actor.ADMIN, info, "Signed as " + signerName.trim());
        return p;
    }

    @Transactional
    public SendResult send(UUID id, ClientInfo info) {
        Proposal p = get(id);
        p.markSent();
        String url = signingUrl(p);
        boolean sent = emailProposal(p);
        log(p, "SENT", Actor.ADMIN, info, sent ? "Emailed to " + p.getClientEmail() : "Email not sent — share the link manually");
        return new SendResult(p, sent, url);
    }

    /** Re-sends the signing email (e.g. client lost it). Only while awaiting the client's signature. */
    @Transactional
    public boolean resendEmail(UUID id, ClientInfo info) {
        Proposal p = get(id);
        if (p.getStatus() != ProposalStatus.SENT && p.getStatus() != ProposalStatus.VIEWED) {
            throw ApiException.conflict("Only proposals waiting for the client's signature can be emailed again.");
        }
        if (!mail.isConfigured()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Email is not configured on the server. Use WhatsApp, your email app, or copy the link instead.");
        }
        boolean sent = emailProposal(p);
        log(p, "EMAIL_RESENT", Actor.ADMIN, info, sent ? "Emailed again to " + p.getClientEmail() : "Email sending failed");
        if (!sent) throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "The email could not be sent. Please try again later.");
        return true;
    }

    /** Records that the admin shared the link through another channel (WhatsApp, email app, copy). */
    @Transactional
    public void recordShare(UUID id, String channel, ClientInfo info) {
        Proposal p = get(id);
        if (p.getStatus() == ProposalStatus.DRAFT || p.getStatus() == ProposalStatus.CANCELLED) {
            throw ApiException.conflict("Send the proposal before sharing its link.");
        }
        String label = switch (channel) {
            case "WHATSAPP" -> "Shared via WhatsApp";
            case "EMAIL_APP" -> "Shared via email app";
            case "COPY" -> "Link copied";
            default -> throw ApiException.badRequest("Unknown share channel.");
        };
        log(p, "LINK_SHARED", Actor.ADMIN, info, label);
    }

    public boolean mailConfigured() {
        return mail.isConfigured();
    }

    private boolean emailProposal(Proposal p) {
        String body = "<p>Hi " + MailService.esc(p.getClientName()) + ",</p>"
                + "<p>Thank you for the opportunity. Your proposal <b>" + MailService.esc(p.getTitle()) + "</b> ("
                + p.getNumber() + ") is ready for your review.</p>"
                + "<p>You can read the full scope and terms, download a PDF, and accept and sign online.</p>";
        return mail.send(List.of(p.getClientEmail()), "Your proposal from " + props.companyName() + " — " + p.getTitle(),
                mail.layout("Your proposal is ready", body, "Review & Sign Proposal", signingUrl(p)), null);
    }

    @Transactional
    public Proposal cancel(UUID id, ClientInfo info) {
        Proposal p = get(id);
        p.cancel();
        log(p, "CANCELLED", Actor.ADMIN, info, null);
        return p;
    }

    @Transactional(readOnly = true)
    public byte[] pdfFor(UUID id) {
        Proposal p = get(id);
        return p.getSignedPdf() != null ? p.getSignedPdf() : pdf.render(p, history(id), false);
    }

    @Transactional
    public Proposal markPaidManually(UUID id, String note, ClientInfo info) {
        Proposal p = get(id);
        p.markPaid();
        log(p, "MARKED_PAID", Actor.ADMIN, info, note == null || note.isBlank() ? "Marked paid manually" : note);
        return p;
    }

    public String signingUrl(Proposal p) {
        return props.baseUrl() + "/sign/" + p.getPublicToken();
    }

    // ------------------------------------------------------------------ client (public token)

    @Transactional
    public Proposal openForClient(String token, ClientInfo info) {
        Proposal p = byToken(token);
        if (p.markViewed()) log(p, "VIEWED", Actor.CLIENT, info, "First opened by client");
        return p;
    }

    @Transactional
    public Proposal clientSign(String token, String signerName, String signature, boolean acceptTerms, ClientInfo info) {
        if (!acceptTerms) throw ApiException.badRequest("Please accept the terms and conditions to continue.");
        Proposal p = byToken(token);
        p.clientSign(signerName.trim(), SignatureImage.validate(signature), info);
        log(p, "TERMS_ACCEPTED", Actor.CLIENT, info, "Accepted the terms and conditions");
        log(p, "CLIENT_SIGNED", Actor.CLIENT, info, "Signed as " + signerName.trim());

        byte[] finalPdf = pdf.render(p, history(p.getId()), true);
        p.attachSignedPdf(finalPdf);
        log(p, "AGREEMENT_SEALED", Actor.SYSTEM, null, "Signed PDF SHA-256 " + p.getSignedPdfHash().substring(0, 16) + "…");

        String body = "<p>Hi " + MailService.esc(p.getClientName()) + ",</p>"
                + "<p>Thank you! <b>" + MailService.esc(p.getTitle()) + "</b> (" + p.getNumber()
                + ") has been signed by both parties. A copy of the signed agreement is attached.</p>"
                + (p.paymentDue() ? "<p>You can pay the advance online from the same link.</p>" : "");
        List<String> to = props.mailFrom() == null || props.mailFrom().isBlank()
                ? List.of(p.getClientEmail()) : List.of(p.getClientEmail(), props.mailFrom());
        mail.send(to, "Signed: " + p.getTitle() + " (" + p.getNumber() + ")",
                mail.layout("Agreement signed", body, "View agreement", signingUrl(p)),
                new MailService.Attachment(p.getNumber() + "-signed.pdf", finalPdf, "application/pdf"));
        return p;
    }

    @Transactional(readOnly = true)
    public byte[] clientPdf(String token) {
        Proposal p = byToken(token);
        if (p.getSignedPdf() != null) return p.getSignedPdf();
        return pdf.render(p, List.of(), false);
    }

    @Transactional(readOnly = true)
    public Proposal byToken(String token) {
        if (token == null || token.length() < 20 || token.length() > 64) throw ApiException.notFound("Proposal");
        Proposal p = proposals.findByPublicToken(token).orElseThrow(() -> ApiException.notFound("Proposal"));
        // Drafts and cancelled proposals are never visible to clients.
        if (p.getStatus() == ProposalStatus.DRAFT || p.getStatus() == ProposalStatus.CANCELLED) {
            throw ApiException.notFound("Proposal");
        }
        return p;
    }

    // ------------------------------------------------------------------ payments hook

    @Transactional
    public void recordPayment(UUID proposalId, String detail) {
        Proposal p = get(proposalId);
        if (p.getStatus() == ProposalStatus.PAID) return;
        p.markPaid();
        log(p, "PAID", Actor.SYSTEM, null, detail);
    }

    @Transactional
    public void logEvent(UUID proposalId, String type, Actor actor, ClientInfo info, String detail) {
        events.save(new ProposalEvent(proposalId, type, actor, info == null ? null : info.ip(),
                info == null ? null : info.userAgent(), detail));
    }

    private void log(Proposal p, String type, Actor actor, ClientInfo info, String detail) {
        logEvent(p.getId(), type, actor, info, detail);
    }
}
