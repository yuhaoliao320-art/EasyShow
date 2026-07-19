-- ============================================
-- 系統設定表（Key-Value）
-- ============================================
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 前台：任何人都可以讀取
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (TRUE);

-- 後台：只有 authenticated 使用者可以寫入
CREATE POLICY "Authenticated users can insert settings" ON settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete settings" ON settings
  FOR DELETE USING (auth.role() = 'authenticated');

-- 自動更新 updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 預設設定值
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('company_name', '易展建材'),
  ('company_phone', '02-1234-5678'),
  ('company_address', '台北市大安區範例路100號'),
  ('company_email', 'service@example.com'),
  ('company_description', '專業建材供應商，提供各類建築材料與裝修用品。');
