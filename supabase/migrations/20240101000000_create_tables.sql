-- ============================================
-- EasyShow Database Schema (Supabase)
-- 建材行產品目錄網站
-- ============================================

-- 1. 分類表（categories）
CREATE TABLE categories (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        TEXT NOT NULL,
  parent_id   BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- 2. 產品表（products）
CREATE TABLE products (
  id            BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name          TEXT NOT NULL,
  category_id   BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description   TEXT DEFAULT '',
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_published ON products(is_published);

-- 3. 產品圖片表（product_images）
CREATE TABLE product_images (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- 允許匿名使用者讀取所有已上架資料
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 前台：任何人都可以讀取
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can read published products" ON products
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can read product images" ON product_images
  FOR SELECT USING (TRUE);

-- 後台：只有 authenticated 使用者可以寫入
CREATE POLICY "Authenticated users can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert product images" ON product_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" ON product_images
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON product_images
  FOR DELETE USING (auth.role() = 'authenticated');

-- 自動更新 updated_at 的函數
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
