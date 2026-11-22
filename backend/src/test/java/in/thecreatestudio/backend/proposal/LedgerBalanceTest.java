package in.thecreatestudio.backend.proposal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.proposal.PaymentEntry.Method;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LedgerBalanceTest {

    private static Proposal signed(long total, long advance) {
        ClientInfo info = new ClientInfo("127.0.0.1", "test");
        Proposal p = new Proposal("TCS-2026-0001");
        p.updateContent(new ProposalContent("T", "C", "c@example.test", "", "", "S", "S", "T", total, advance, null));
        p.ownerSign("Owner", "sig", info);
        p.markSent();
        p.clientSign("Client", "sig", info);
        return p;
    }

    private static PaymentEntry entry(Proposal p, Method method, long amount) {
        return new PaymentEntry(UUID.randomUUID(), p.getId(), method, amount, LocalDate.now(), null, null, "test");
    }

    @Test
    void advanceIsDueUntilTheAdminRequestsSomethingElse() {
        Proposal p = signed(50_000, 20_000);
        assertEquals(20_000, LedgerService.balance(p, List.of()).dueNowPaise());
        assertEquals(15_000, LedgerService.balance(p, List.of(entry(p, Method.CASH, 5_000))).dueNowPaise());
    }

    @Test
    void cashAndOnlineAreSplit() {
        Proposal p = signed(50_000, 20_000);
        var b = LedgerService.balance(p, List.of(entry(p, Method.CASH, 5_000), entry(p, Method.ONLINE, 15_000)));
        assertEquals(15_000, b.onlinePaise());
        assertEquals(5_000, b.offlinePaise());
        assertEquals(30_000, b.balancePaise());
        assertEquals(0, b.dueNowPaise());
    }

    @Test
    void cancelledEntriesMakeTheAmountDueAgain() {
        Proposal p = signed(50_000, 20_000);
        PaymentEntry e = entry(p, Method.CASH, 20_000);
        e.cancel("admin", "mistake");
        assertEquals(20_000, LedgerService.balance(p, List.of(e)).dueNowPaise());
    }

    @Test
    void fullPaymentIsPaidAndCancellingItReopens() {
        Proposal p = signed(50_000, 20_000);
        p.syncPaid(20_000);
        assertEquals(ProposalStatus.SIGNED, p.getStatus());
        p.syncPaid(50_000);
        assertEquals(ProposalStatus.PAID, p.getStatus());
        p.syncPaid(30_000);
        assertEquals(ProposalStatus.SIGNED, p.getStatus());
    }

    @Test
    void pastDueDateIsOverdue() {
        Proposal p = signed(50_000, 0);
        p.requestPayment(10_000, LocalDate.now().minusDays(3), null);
        assertTrue(LedgerService.balance(p, List.of()).overdue());
    }

    @Test
    void upiAndBankCountAsOnlineChequeDoesNot() {
        Proposal p = signed(50_000, 0);
        var b = LedgerService.balance(p, List.of(entry(p, Method.UPI, 10_000), entry(p, Method.BANK_TRANSFER, 7_000),
                entry(p, Method.CHEQUE, 3_000)));
        assertEquals(17_000, b.onlinePaise());
        assertEquals(3_000, b.offlinePaise());
    }

    @Test
    void overpaymentIsReported() {
        Proposal p = signed(50_000, 20_000);
        var b = LedgerService.balance(p, List.of(entry(p, Method.CASH, 45_000), entry(p, Method.ONLINE, 20_000)));
        assertEquals(15_000, b.overpaidPaise());
        assertEquals(0, b.balancePaise());
    }
}
