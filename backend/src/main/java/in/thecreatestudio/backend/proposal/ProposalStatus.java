package in.thecreatestudio.backend.proposal;

/**
 * Lifecycle: DRAFT → SENT → VIEWED → SIGNED → PAID, or CANCELLED from any state
 * before SIGNED. Content is editable only in DRAFT; once SENT it is locked
 * (content_hash) so the client signs exactly what was sent.
 */
public enum ProposalStatus {
    DRAFT,
    SENT,
    VIEWED,
    SIGNED,
    PAID,
    CANCELLED
}
