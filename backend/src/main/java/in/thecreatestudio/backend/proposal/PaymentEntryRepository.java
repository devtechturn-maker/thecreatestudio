package in.thecreatestudio.backend.proposal;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface PaymentEntryRepository extends JpaRepository<PaymentEntry, UUID> {

    List<PaymentEntry> findByProposalIdOrderByPaidOnDescCreatedAtDesc(UUID proposalId);

    @Query("select coalesce(sum(e.amountPaise), 0) from PaymentEntry e where e.proposalId = :proposalId and e.voidedAt is null")
    long totalReceived(UUID proposalId);
}
