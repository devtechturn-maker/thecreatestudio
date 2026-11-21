package in.thecreatestudio.backend.proposal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Append-only audit trail entry. */
@Entity
@Table(name = "proposal_event")
public class ProposalEvent {

    public enum Actor { ADMIN, CLIENT, SYSTEM }

    @Id
    private UUID id;

    @Column(name = "proposal_id", nullable = false)
    private UUID proposalId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String actor;

    private String ip;

    @Column(name = "user_agent")
    private String userAgent;

    private String detail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ProposalEvent() {}

    public ProposalEvent(UUID proposalId, String type, Actor actor, String ip, String userAgent, String detail) {
        this.id = UUID.randomUUID();
        this.proposalId = proposalId;
        this.type = type;
        this.actor = actor.name();
        this.ip = ip;
        this.userAgent = userAgent;
        this.detail = detail == null || detail.length() <= 500 ? detail : detail.substring(0, 500);
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getProposalId() { return proposalId; }
    public String getType() { return type; }
    public String getActor() { return actor; }
    public String getIp() { return ip; }
    public String getUserAgent() { return userAgent; }
    public String getDetail() { return detail; }
    public Instant getCreatedAt() { return createdAt; }
}
