-- ============================================
-- 新增 settings 表的 description 與 value_type 欄位
-- ============================================

-- 新增欄位
ALTER TABLE settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS value_type TEXT NOT NULL DEFAULT 'text'
  CHECK (value_type IN ('text', 'number', 'boolean', 'email', 'tel', 'url', 'textarea'));

-- 更新預設設定的 description 與 value_type
UPDATE settings SET
  description = '公司名稱',
  value_type = 'text'
WHERE key = 'company_name';

UPDATE settings SET
  description = '公司電話',
  value_type = 'tel'
WHERE key = 'company_phone';

UPDATE settings SET
  description = '公司地址',
  value_type = 'text'
WHERE key = 'company_address';

UPDATE settings SET
  description = '公司 Email',
  value_type = 'email'
WHERE key = 'company_email';

UPDATE settings SET
  description = '公司簡介',
  value_type = 'textarea'
WHERE key = 'company_description';
