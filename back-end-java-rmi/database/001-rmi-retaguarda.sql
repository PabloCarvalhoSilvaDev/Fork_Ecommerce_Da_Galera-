BEGIN;

CREATE TABLE IF NOT EXISTS ecommerce.cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_date DATE UNIQUE NOT NULL,
    orders_count INT NOT NULL CHECK (orders_count >= 0),
    paid_count INT NOT NULL CHECK (paid_count >= 0),
    delivered_count INT NOT NULL CHECK (delivered_count >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_total NUMERIC(14, 2) NOT NULL CHECK (shipping_total >= 0),
    discount_total NUMERIC(14, 2) NOT NULL CHECK (discount_total >= 0),
    gross_revenue NUMERIC(14, 2) NOT NULL CHECK (gross_revenue >= 0),
    revenue_by_method JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(revenue_by_method) = 'object'),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ecommerce.rmi_job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(50) NOT NULL CHECK (job_name IN ('CONSOLIDACAO_ESTOQUE', 'FECHAMENTO_CAIXA')),
    status VARCHAR(10) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
    triggered_by TEXT NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(summary) = 'object'),
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_rmi_job_runs_started_at ON ecommerce.rmi_job_runs(started_at DESC);

CREATE OR REPLACE FUNCTION audit.trg_record_inventory_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = audit, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, new_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.product_id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW IS DISTINCT FROM OLD THEN
            INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, old_data, new_data)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.product_id, to_jsonb(OLD), to_jsonb(NEW));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, old_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.product_id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_inventory ON ecommerce.inventory;
CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON ecommerce.inventory
FOR EACH ROW EXECUTE FUNCTION audit.trg_record_inventory_activity();

DROP TRIGGER IF EXISTS audit_cash_closings ON ecommerce.cash_closings;
CREATE TRIGGER audit_cash_closings AFTER INSERT OR UPDATE OR DELETE ON ecommerce.cash_closings
FOR EACH ROW EXECUTE FUNCTION audit.trg_record_activity();

DROP TRIGGER IF EXISTS audit_rmi_job_runs ON ecommerce.rmi_job_runs;
CREATE TRIGGER audit_rmi_job_runs AFTER INSERT OR UPDATE OR DELETE ON ecommerce.rmi_job_runs
FOR EACH ROW EXECUTE FUNCTION audit.trg_record_activity();

DROP TRIGGER IF EXISTS set_updated_at_cash_closings ON ecommerce.cash_closings;
CREATE TRIGGER set_updated_at_cash_closings BEFORE UPDATE ON ecommerce.cash_closings
FOR EACH ROW EXECUTE FUNCTION ecommerce.trg_set_updated_at();

GRANT SELECT, INSERT, UPDATE ON ecommerce.cash_closings TO ecommerce_app_group;
GRANT SELECT, INSERT, UPDATE ON ecommerce.rmi_job_runs TO ecommerce_app_group;

COMMIT;
