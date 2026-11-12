BEGIN;

CREATE TABLE IF NOT EXISTS ecommerce.revoked_tokens (
    jti UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ecommerce.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at
    ON ecommerce.revoked_tokens(expires_at);

GRANT SELECT, INSERT, DELETE ON ecommerce.revoked_tokens TO ecommerce_app_group;
REVOKE UPDATE ON ecommerce.revoked_tokens FROM ecommerce_app_group;

COMMIT;
