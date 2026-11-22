package in.thecreatestudio.backend.config;

import in.thecreatestudio.backend.proposal.ProposalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tells the admin UI which integrations are configured, so it only offers options that work. */
@RestController
class IntegrationStatusController {

    record Status(boolean emailConfigured, String emailProblem, String publicBaseUrl) {}

    private final ProposalService proposals;
    private final AppProperties props;

    IntegrationStatusController(ProposalService proposals, AppProperties props) {
        this.proposals = proposals;
        this.props = props;
    }

    @GetMapping("/api/admin/integrations")
    Status status() {
        String emailProblem = proposals.mailProblem();
        return new Status(emailProblem == null, emailProblem, props.baseUrl());
    }
}
