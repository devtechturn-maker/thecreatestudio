package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.proposal.ProposalDtos.ClientProposalView;
import in.thecreatestudio.backend.proposal.ProposalDtos.ClientSignRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Client-facing endpoints. Access is granted by the unguessable 256-bit token in the
 * signing link; drafts and cancelled proposals return 404.
 */
@RestController
@RequestMapping("/api/public/proposals/{token}")
class PublicProposalController {

    private final ProposalService service;

    PublicProposalController(ProposalService service) {
        this.service = service;
    }

    @GetMapping
    ResponseEntity<ClientProposalView> view(@PathVariable String token, HttpServletRequest req) {
        Proposal p = service.openForClient(token, ClientInfo.from(req));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ClientProposalView.of(p));
    }

    @PostMapping("/sign")
    ClientProposalView sign(@PathVariable String token, @Valid @RequestBody ClientSignRequest body, HttpServletRequest req) {
        Proposal p = service.clientSign(token, body.signerName(), body.signature(), body.acceptTerms(), ClientInfo.from(req));
        return ClientProposalView.of(p);
    }

    @GetMapping("/pdf")
    ResponseEntity<byte[]> pdf(@PathVariable String token) {
        Proposal p = service.byToken(token);
        byte[] bytes = service.clientPdf(token);
        String name = p.getNumber() + (p.getSignedPdf() != null ? "-signed" : "") + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
                .body(bytes);
    }
}
