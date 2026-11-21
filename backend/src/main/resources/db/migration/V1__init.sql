-- TheCreateStudio — initial schema

CREATE TABLE admin_user (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL
);

CREATE SEQUENCE proposal_number_seq START 1;

CREATE TABLE proposal (
    id                 UUID PRIMARY KEY,
    number             VARCHAR(30)  NOT NULL UNIQUE,
    title              VARCHAR(200) NOT NULL,
    client_name        VARCHAR(120) NOT NULL,
    client_email       VARCHAR(255) NOT NULL,
    client_phone       VARCHAR(30),
    client_company     VARCHAR(160),
    summary            TEXT         NOT NULL,
    scope              TEXT         NOT NULL,
    terms              TEXT         NOT NULL,
    currency           VARCHAR(3)   NOT NULL DEFAULT 'INR',
    amount_paise       BIGINT       NOT NULL CHECK (amount_paise >= 0),
    advance_paise      BIGINT       NOT NULL DEFAULT 0 CHECK (advance_paise >= 0),
    valid_until        DATE,
    status             VARCHAR(20)  NOT NULL,
    public_token       VARCHAR(64)  NOT NULL UNIQUE,
    content_hash       VARCHAR(64),

    owner_signer_name  VARCHAR(120),
    owner_signature    TEXT,
    owner_signed_at    TIMESTAMPTZ,
    owner_signed_ip    VARCHAR(64),

    client_signer_name VARCHAR(120),
    client_signature   TEXT,
    client_signed_at   TIMESTAMPTZ,
    client_signed_ip   VARCHAR(64),
    client_user_agent  VARCHAR(400),
    terms_accepted_at  TIMESTAMPTZ,

    sent_at            TIMESTAMPTZ,
    first_viewed_at    TIMESTAMPTZ,
    paid_at            TIMESTAMPTZ,
    cancelled_at       TIMESTAMPTZ,

    signed_pdf         BYTEA,
    signed_pdf_hash    VARCHAR(64),

    created_at         TIMESTAMPTZ  NOT NULL,
    updated_at         TIMESTAMPTZ  NOT NULL,
    version            BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT advance_not_above_total CHECK (advance_paise <= amount_paise)
);

CREATE INDEX idx_proposal_status ON proposal (status);
CREATE INDEX idx_proposal_created ON proposal (created_at DESC);

-- Append-only audit trail for each proposal (created, sent, viewed, signed, paid...)
CREATE TABLE proposal_event (
    id          UUID PRIMARY KEY,
    proposal_id UUID         NOT NULL REFERENCES proposal (id) ON DELETE CASCADE,
    type        VARCHAR(40)  NOT NULL,
    actor       VARCHAR(20)  NOT NULL,
    ip          VARCHAR(64),
    user_agent  VARCHAR(400),
    detail      VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_event_proposal ON proposal_event (proposal_id, created_at);

CREATE TABLE payment (
    id                  UUID PRIMARY KEY,
    proposal_id         UUID         NOT NULL REFERENCES proposal (id) ON DELETE CASCADE,
    razorpay_order_id   VARCHAR(64)  NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(64)  UNIQUE,
    amount_paise        BIGINT       NOT NULL,
    currency            VARCHAR(3)   NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    method              VARCHAR(40),
    failure_reason      VARCHAR(300),
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_payment_proposal ON payment (proposal_id);
