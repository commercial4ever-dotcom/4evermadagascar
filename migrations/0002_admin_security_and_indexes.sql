-- 4EVER Madagascar — Migration 0002 : Sécurité setup et index complémentaires
-- Non destructif : uniquement des ajouts idempotents.

CREATE TABLE IF NOT EXISTS login_attempts (
  identifier TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
