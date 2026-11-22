package in.thecreatestudio.backend.payment;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

interface PaymentRepository extends JpaRepository<Payment, UUID> {

    // Locked, so the checkout callback and the webhook cannot settle the same order together.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Payment> findByRazorpayOrderId(String orderId);

    List<Payment> findByProposalIdOrderByCreatedAtDesc(UUID proposalId);

    Optional<Payment> findFirstByProposalIdAndStatusOrderByCreatedAtDesc(UUID proposalId, Payment.Status status);
}
