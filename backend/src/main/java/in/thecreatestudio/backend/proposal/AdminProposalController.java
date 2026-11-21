package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.proposal.ProposalDtos.AdminProposalView;
import in.thecreatestudio.backend.proposal.ProposalDtos.MarkPaidRequest;
import in.thecreatestudio.backend.proposal.ProposalDtos.PageView;
import in.thecreatestudio.backend.proposal.ProposalDtos.ProposalSummary;
import in.thecreatestudio.backend.proposal.ProposalDtos.SendResponse;
import in.thecreatestudio.backend.proposal.ProposalDtos.SignRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin-only proposal management (JWT required, see SecurityConfig). */
@RestController
@RequestMapping("/api/admin/proposals")
class AdminProposalController {

    private final ProposalService service;

    AdminProposalController(ProposalService service) {
        this.service = service;
    }

    @GetMapping
    PageView<ProposalSummary> list(@RequestParam(required = false) ProposalStatus status,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Page<Proposal> p = service.list(status, page, size);
        return new PageView<>(p.getContent().stream().map(ProposalSummary::of).toList(), p.getNumber(), p.getSize(), p.getTotalElements());
    }

    @GetMapping("/{id}")
    AdminProposalView get(@PathVariable UUID id) {
        return view(service.get(id));
    }

    @PostMapping
    AdminProposalView create(@Valid @RequestBody ProposalContent body, HttpServletRequest req) {
        return view(service.create(body, ClientInfo.from(req)));
    }

    @PutMapping("/{id}")
    AdminProposalView update(@PathVariable UUID id, @Valid @RequestBody ProposalContent body, HttpServletRequest req) {
        return view(service.update(id, body, ClientInfo.from(req)));
    }

    @PostMapping("/{id}/sign")
    AdminProposalView sign(@PathVariable UUID id, @Valid @RequestBody SignRequest body, HttpServletRequest req) {
        return view(service.ownerSign(id, body.signerName(), body.signature(), ClientInfo.from(req)));
    }

    @PostMapping("/{id}/send")
    SendResponse send(@PathVariable UUID id, HttpServletRequest req) {
        ProposalService.SendResult r = service.send(id, ClientInfo.from(req));
        return new SendResponse(view(r.proposal()), r.emailSent(), r.signingUrl());
    }

    @PostMapping("/{id}/resend-email")
    java.util.Map<String, Object> resendEmail(@PathVariable UUID id, HttpServletRequest req) {
        service.resendEmail(id, ClientInfo.from(req));
        return java.util.Map.of("emailSent", true);
    }

    record ShareRequest(@jakarta.validation.constraints.NotBlank String channel) {}

    @PostMapping("/{id}/share")
    AdminProposalView share(@PathVariable UUID id, @Valid @RequestBody ShareRequest body, HttpServletRequest req) {
        service.recordShare(id, body.channel(), ClientInfo.from(req));
        return view(service.get(id));
    }

    @PostMapping("/{id}/cancel")
    AdminProposalView cancel(@PathVariable UUID id, HttpServletRequest req) {
        return view(service.cancel(id, ClientInfo.from(req)));
    }

    @PostMapping("/{id}/mark-paid")
    AdminProposalView markPaid(@PathVariable UUID id, @Valid @RequestBody MarkPaidRequest body, HttpServletRequest req) {
        return view(service.markPaidManually(id, body.note(), ClientInfo.from(req)));
    }

    @GetMapping("/{id}/pdf")
    ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        Proposal p = service.get(id);
        byte[] bytes = service.pdfFor(id);
        String name = p.getNumber() + (p.getSignedPdf() != null ? "-signed" : "") + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
                .body(bytes);
    }

    private AdminProposalView view(Proposal p) {
        return AdminProposalView.of(p, service.signingUrl(p), service.history(p.getId()));
    }
}
