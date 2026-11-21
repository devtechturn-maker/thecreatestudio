package in.thecreatestudio.backend.proposal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/** Lifecycle rules that protect the integrity of signed agreements. */
class ProposalTest {

    private static final ClientInfo INFO = new ClientInfo("127.0.0.1", "test");
    private static final String SIG = "data:image/png;base64,xyz";

    private static ProposalContent content(long amount, long advance) {
        return new ProposalContent("Title", "Client", "client@example.test", "", "", "Summary", "Scope", "Terms",
                amount, advance, LocalDate.now().plusDays(10));
    }

    private static Proposal draft() {
        Proposal p = new Proposal("TCS-2026-0001");
        p.updateContent(content(100_00, 50_00));
        return p;
    }

    @Test
    void fullHappyPath() {
        Proposal p = draft();
        p.ownerSign("Owner", SIG, INFO);
        p.markSent();
        p.markViewed();
        p.clientSign("Client", SIG, INFO);
        assertEquals(ProposalStatus.SIGNED, p.getStatus());
        p.markPaid();
        assertEquals(ProposalStatus.PAID, p.getStatus());
    }

    @Test
    void cannotSendWithoutOwnerSignature() {
        assertThrows(ApiException.class, draft()::markSent);
    }

    @Test
    void editingClearsOwnerSignature() {
        Proposal p = draft();
        p.ownerSign("Owner", SIG, INFO);
        assertNotNull(p.getContentHash());
        p.updateContent(content(200_00, 0));
        assertNull(p.getOwnerSignature());
        assertNull(p.getContentHash());
    }

    @Test
    void sentProposalCannotBeEdited() {
        Proposal p = draft();
        p.ownerSign("Owner", SIG, INFO);
        p.markSent();
        assertThrows(ApiException.class, () -> p.updateContent(content(1, 0)));
    }

    @Test
    void advanceCannotExceedTotal() {
        assertThrows(ApiException.class, () -> new Proposal("X").updateContent(content(100, 200)));
    }

    @Test
    void expiredProposalCannotBeSigned() {
        Proposal p = new Proposal("TCS-2026-0002");
        p.updateContent(new ProposalContent("T", "C", "c@example.test", "", "", "S", "S", "T", 100, 0,
                LocalDate.now(Proposal.BUSINESS_ZONE).minusDays(1)));
        p.ownerSign("Owner", SIG, INFO);
        p.markSent();
        assertThrows(ApiException.class, () -> p.clientSign("Client", SIG, INFO));
    }

    @Test
    void cannotPayBeforeSigning() {
        Proposal p = draft();
        assertThrows(ApiException.class, p::markPaid);
    }

    @Test
    void contentHashChangesWithAmount() {
        Proposal a = draft();
        Proposal b = new Proposal("TCS-2026-0001");
        b.updateContent(content(100_01, 50_00));
        assertNotNull(a.computeContentHash());
        org.junit.jupiter.api.Assertions.assertNotEquals(a.computeContentHash(), b.computeContentHash());
    }
}
