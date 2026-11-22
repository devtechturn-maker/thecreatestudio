-- Payment ledger: every rupee received (online or offline) is one row. Rows are never deleted.

ALTER TABLE payment ADD COLUMN key_id VARCHAR(64); -- which Razorpay key created the order

-- What the admin has asked the client to pay so far, as a running total.
-- "Due now" = requested_total - received. NULL means the signed advance.
ALTER TABLE proposal ADD COLUMN requested_total_paise BIGINT CHECK (requested_total_paise >= 0);
ALTER TABLE proposal ADD COLUMN due_date DATE;
ALTER TABLE proposal ADD COLUMN due_note VARCHAR(300);

CREATE TABLE payment_entry (
    id           UUID PRIMARY KEY,
    proposal_id  UUID         NOT NULL REFERENCES proposal (id) ON DELETE RESTRICT,
    payment_id   UUID UNIQUE  REFERENCES payment (id) ON DELETE RESTRICT,
    method       VARCHAR(20)  NOT NULL CHECK (method IN ('ONLINE', 'CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')),
    amount_paise BIGINT       NOT NULL CHECK (amount_paise > 0),
    paid_on      DATE         NOT NULL,
    reference    VARCHAR(120),
    note         VARCHAR(500),
    test_mode    BOOLEAN      NOT NULL DEFAULT FALSE,
    recorded_by  VARCHAR(255) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL,
    voided_at    TIMESTAMPTZ,
    voided_by    VARCHAR(255),
    void_reason  VARCHAR(300)
);

CREATE INDEX idx_payment_entry_proposal ON payment_entry (proposal_id);

-- 1. Verified Razorpay payments made before the ledger existed.
INSERT INTO payment_entry (id, proposal_id, payment_id, method, amount_paise, paid_on, reference, note, recorded_by, created_at)
SELECT gen_random_uuid(), proposal_id, id, 'ONLINE', amount_paise, (updated_at AT TIME ZONE 'Asia/Kolkata')::date,
       razorpay_payment_id, 'Imported online payment', 'system', updated_at
FROM payment
WHERE status = 'PAID' AND amount_paise > 0;

-- 2. "Mark as paid" never stored an amount. It was offered for the advance (or the full fee when
--    there was no advance), so that amount is imported and flagged for the admin to check.
INSERT INTO payment_entry (id, proposal_id, method, amount_paise, paid_on, note, recorded_by, created_at)
SELECT gen_random_uuid(), p.id, 'OTHER',
       CASE WHEN p.advance_paise > 0 THEN p.advance_paise ELSE p.amount_paise END,
       (COALESCE(p.paid_at, p.updated_at) AT TIME ZONE 'Asia/Kolkata')::date,
       'CHECK AMOUNT: imported from "Mark as paid"', 'system', COALESCE(p.paid_at, p.updated_at)
FROM proposal p
WHERE p.status = 'PAID'
  AND p.amount_paise > 0
  AND NOT EXISTS (SELECT 1 FROM payment_entry e WHERE e.proposal_id = p.id);

-- 3. PAID now means the whole fee, not just the advance.
UPDATE proposal p
SET status = 'SIGNED', paid_at = NULL, version = version + 1
WHERE p.status = 'PAID'
  AND COALESCE((SELECT SUM(e.amount_paise) FROM payment_entry e WHERE e.proposal_id = p.id), 0) < p.amount_paise;
