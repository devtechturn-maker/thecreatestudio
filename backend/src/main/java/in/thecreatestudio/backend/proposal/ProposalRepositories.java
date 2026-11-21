package in.thecreatestudio.backend.proposal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ProposalRepository extends JpaRepository<Proposal, UUID> {

    Optional<Proposal> findByPublicToken(String publicToken);

    Page<Proposal> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Proposal> findByStatusOrderByCreatedAtDesc(ProposalStatus status, Pageable pageable);

    @Query(value = "select nextval('proposal_number_seq')", nativeQuery = true)
    long nextNumber();
}

interface ProposalEventRepository extends JpaRepository<ProposalEvent, UUID> {
    List<ProposalEvent> findByProposalIdOrderByCreatedAtAsc(UUID proposalId);
}
