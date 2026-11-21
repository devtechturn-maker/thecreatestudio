package in.thecreatestudio.backend.config;

import in.thecreatestudio.backend.payment.PaymentService;
import in.thecreatestudio.backend.proposal.ProposalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tells the admin UI which integrations are configured, so it only offers options that work. */
@RestController
class IntegrationStatusController {

    record Status(boolean emailConfigured, boolean paymentsConfigured, String publicBaseUrl) {}

    private final ProposalService proposals;
    private final PaymentService payments;
    private final AppProperties props;

    IntegrationStatusController(ProposalService proposals, PaymentService payments, AppProperties props) {
        this.proposals = proposals;
        this.payments = payments;
        this.props = props;
    }

    @GetMapping("/api/admin/integrations")
    Status status() {
        return new Status(proposals.mailConfigured(), payments.enabled(), props.baseUrl());
    }
}
