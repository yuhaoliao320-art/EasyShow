-- ============================================
-- EasyShow: 產品標籤功能（US-20）
-- 在 products 表新增 tags 欄位（TEXT array）
-- ============================================

ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';

-- 建立 GIN index 加速標籤查詢（如查詢所有 hot 產品）
CREATE INDEX idx_products_tags ON products USING GIN (tags);
