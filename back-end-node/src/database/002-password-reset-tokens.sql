BEGIN;

CREATE TABLE IF NOT EXISTS ecommerce.password_reset_tokens (
    user_id UUID PRIMARY KEY REFERENCES ecommerce.users(id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON ecommerce.password_reset_tokens TO ecommerce_app_group;

COMMIT;
