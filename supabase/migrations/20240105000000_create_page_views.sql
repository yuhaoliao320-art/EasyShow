-- ============================================
-- EasyShow: 產品瀏覽次數統計（US-21）
-- 記錄每次產品詳情頁的瀏覽事件
-- ============================================

CREATE TABLE product_page_views (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_views_product_id ON product_page_views(product_id);
CREATE INDEX idx_views_viewed_at ON product_page_views(viewed_at);

ALTER TABLE product_page_views ENABLE ROW LEVEL SECURITY;

-- 前台：任何人都可以寫入（用於追蹤瀏覽）
CREATE POLICY "Anyone can insert page views" ON product_page_views
  FOR INSERT WITH CHECK (TRUE);

-- 後台：只有 authenticated 使用者可以讀取統計
CREATE POLICY "Authenticated users can read page views" ON product_page_views
  FOR SELECT USING (auth.role() = 'authenticated');
