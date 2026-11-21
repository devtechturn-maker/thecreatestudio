package in.thecreatestudio.backend.payment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByRazorpayOrderId(String orderId);

    List<Payment> findByProposalIdOrderByCreatedAtDesc(UUID proposalId);

    Optional<Payment> findFirstByProposalIdAndStatusOrderByCreatedAtDesc(UUID proposalId, Payment.Status status);
}
