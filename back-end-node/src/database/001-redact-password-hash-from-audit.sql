CREATE OR REPLACE FUNCTION audit.trg_record_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = audit, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_data JSONB;
    v_old_data JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        IF TG_TABLE_SCHEMA = 'ecommerce' AND TG_TABLE_NAME = 'users' THEN
            v_new_data := v_new_data - 'password_hash';
        END IF;
        INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, new_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, v_new_data);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW IS DISTINCT FROM OLD THEN
            v_new_data := to_jsonb(NEW);
            v_old_data := to_jsonb(OLD);
            IF TG_TABLE_SCHEMA = 'ecommerce' AND TG_TABLE_NAME = 'users' THEN
                v_new_data := v_new_data - 'password_hash';
                v_old_data := v_old_data - 'password_hash';
            END IF;
            INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, old_data, new_data)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, v_old_data, v_new_data);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        IF TG_TABLE_SCHEMA = 'ecommerce' AND TG_TABLE_NAME = 'users' THEN
            v_old_data := v_old_data - 'password_hash';
        END IF;
        INSERT INTO audit.activity_log (schema_name, table_name, operation, record_id, old_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.id, v_old_data);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;
