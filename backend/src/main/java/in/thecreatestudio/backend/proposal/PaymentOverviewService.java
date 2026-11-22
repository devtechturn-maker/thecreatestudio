package in.thecreatestudio.backend.proposal;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/** All clients' balances for the admin Payments page. Plain SQL, to avoid loading every signed PDF. */
@Service
class PaymentOverviewService {

    record ProjectRow(UUID id, String number, String title, String clientName, String clientEmail, String clientCompany,
                      String status, long totalPaise, long paidPaise, long balancePaise, long dueNowPaise,
                      LocalDate dueDate, boolean overdue) {}

    record EntryRow(UUID id, UUID proposalId, String number, String clientName, String method, long amountPaise,
                    LocalDate paidOn, String reference, String note, boolean testMode, boolean cancelled, String voidReason) {}

    record Overview(List<ProjectRow> projects, List<EntryRow> entries) {}

    private final JdbcClient jdbc;

    PaymentOverviewService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // The due-now formula mirrors Proposal.dueNow(). Repeatable read keeps both lists consistent.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    Overview overview() {
        List<ProjectRow> projects = jdbc.sql("""
                WITH money AS (
                    SELECT p.*, COALESCE((SELECT SUM(e.amount_paise) FROM payment_entry e
                                          WHERE e.proposal_id = p.id AND e.voided_at IS NULL), 0)::bigint AS received
                    FROM proposal p
                ), due AS (
                    SELECT m.*, CASE WHEN m.status = 'SIGNED'
                        THEN GREATEST(LEAST(COALESCE(m.requested_total_paise, m.advance_paise), m.amount_paise) - m.received, 0)
                        ELSE 0 END AS due_now
                    FROM money m
                )
                SELECT id, number, title, client_name, client_email, client_company, status,
                       amount_paise AS total_paise,
                       received AS paid_paise,
                       GREATEST(amount_paise - received, 0) AS balance_paise,
                       due_now AS due_now_paise,
                       CASE WHEN due_now > 0 THEN due_date END AS due_date,
                       COALESCE(due_now > 0 AND due_date < :today, FALSE) AS overdue
                FROM due
                WHERE status IN ('SIGNED', 'PAID') OR received > 0
                ORDER BY overdue DESC, due_now DESC, created_at DESC
                """).param("today", LocalDate.now(Proposal.BUSINESS_ZONE)).query(ProjectRow.class).list();

        List<EntryRow> entries = jdbc.sql("""
                SELECT e.id, e.proposal_id, p.number, p.client_name, e.method, e.amount_paise, e.paid_on,
                       e.reference, e.note, e.test_mode, e.voided_at IS NOT NULL AS cancelled, e.void_reason
                FROM payment_entry e
                JOIN proposal p ON p.id = e.proposal_id
                ORDER BY e.paid_on DESC, e.created_at DESC
                """).query(EntryRow.class).list();

        return new Overview(projects, entries);
    }
}
