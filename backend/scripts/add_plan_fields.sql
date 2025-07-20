-- Adicionar novos campos à tabela plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_invoices INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS marketplace_sync BOOLEAN DEFAULT FALSE;

-- Atualizar planos existentes com valores padrão
UPDATE plans SET max_invoices = 0 WHERE max_invoices IS NULL;
UPDATE plans SET marketplace_sync = FALSE WHERE marketplace_sync IS NULL; 