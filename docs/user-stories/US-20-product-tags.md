# User Story：熱門產品 / 新品標籤

## 📌 基本資訊

| 欄位 | 內容 |
|------|------|
| **故事 ID** | US-20 |
| **建立日期** | 2026-07-19 |
| **對應專案** | EasyShow（建材產品目錄網站） |
| **標籤** | `前台` `行銷` `標籤` `產品` |

---

## 🎯 User Story

**As a** 前台瀏覽訪客（消費者／設計師）
**I want** 在首頁或分類頁看到標示「🔥 熱門」或「🆕 新品」的產品
**So that** 我可以優先瀏覽店家推薦或最新上市的產品，節省挑選時間

---

## 📐 技術脈絡

- 目前 Product 資料模型僅有 `is_published` 布林值，無「標籤」或「標記」機制
- 需要擴充：
  - **資料庫層**：在 `products` 表新增 `tags` 欄位（TEXT[] 或逗號分隔字串），或新增獨立的 `product_tags` 多對多表
  - **後台管理**：產品表單需新增標籤勾選或輸入 UI
  - **前台顯示**：產品卡片需根據標籤顯示對應徽章（Badge）
- 「新品」可依 `created_at` 自動判斷（如 30 天內建立），「熱門」可由管理者手動標記

---

## ✅ 驗收條件（Acceptance Criteria）

### AC-01：管理者可為產品標記標籤
**Given** 我在後台新增或編輯產品
**When** 表單載入完成
**Then** 我看到「產品標籤」區域，包含以下可勾選項目：
- 🔥 熱門
- 🆕 新品
- 特價
- （預留其他自訂標籤）

### AC-02：標籤儲存與回顯
**Given** 我已勾選「🔥 熱門」並儲存產品
**When** 我重新進入編輯頁面
**Then** 該產品的「🔥 熱門」選項已預先勾選

### AC-03：前台產品卡片顯示標籤徽章
**Given** 某產品已被標記為「🔥 熱門」
**When** 該產品出現在前台的首頁、分類頁或搜尋結果頁
**Then** 產品的卡片右上角顯示對應的標籤徽章（Badge），樣式清晰可辨

### AC-04：新品自動標記
**Given** 某產品的 `created_at` 距今 ≤ 30 天
**When** 前台渲染產品卡片
**Then** 自動顯示「🆕 新品」徽章，無需管理者手動標記
**And** 超過 30 天後徽章自動消失

### AC-05：首頁熱門精選區塊
**Given** 我在首頁
**When** 頁面載入完成
**Then** 我看到一個「🔥 熱門產品」精選區塊，展示最多 8 個被標記為熱門的產品（隨機或依 sort_order 排序）

### AC-06：多標籤疊加顯示
**Given** 某產品同時被標記為「熱門」且為「新品」（created_at ≤ 30 天）
**When** 產品卡片在前台渲染
**Then** 卡片上同時顯示兩個徽章，順序為新品（左）→ 熱門（右）

---

## ⚠️ 邊界案例（Edge Cases）

| 編號 | 情境 | 預期行為 |
|------|------|---------|
| EC-01 | 產品無任何標籤且不是新品 | 不顯示任何徽章，卡片保持簡潔 |
| EC-02 | 所有產品都被標記為熱門 | 熱門精選區塊隨機選取 8 項，或依 sort_order 顯示前 8 項 |
| EC-03 | 產品編輯時取消所有標籤 | 取消勾選後儲存，前台該產品徽章消失 |
| EC-04 | 管理者輸入自訂標籤文字過長 | 限制標籤文字最多 10 個中文字，超出以「…」截斷 |
| EC-05 | 新產品建立但未上架（is_published = false） | 即使為新品，前台也不顯示徽章 |
| EC-06 | 30 天緩衝邊界 | 建立第 30 天仍顯示新品，第 31 天凌晨自動移除（可依 UTC 日期計算） |

---

## ⚡ 非功能性需求（NFR）

| 類別 | 需求描述 | 驗收標準 |
|------|---------|---------|
| 可用性 | 徽章顏色符合無障礙對比度 | 徽章文字與背景的對比度 ≥ 4.5:1（WCAG AA） |
| 可用性 | 標籤不干擾產品圖片 | 徽章僅佔卡片右上角小區域，不遮擋產品主要內容 |
| 效能 | 熱門產品查詢 | 後端 API 回應時間 < 200ms |
| 可擴充性 | 標籤系統可擴充 | 未來新增標籤類型不需改動資料庫結構（使用 array 或 reference table） |

---

## 🔗 依賴條件（Dependencies）

| 依賴項目 | 說明 | 狀態 |
|---------|------|------|
| Product tags 資料庫欄位 | 需在 `products` 表新增 `tags` TEXT[] 或新增 `product_tags` 表 | ❌ 需新增 |
| 後台 ProductFormModal | 需新增標籤勾選 UI | ⚠️ 需修改 |
| Product 前端型別 | 需擴充 `Product` interface | ⚠️ 需修改 |
| ProductCard 元件 | 需新增標籤徽章渲染邏輯 | ⚠️ 需修改 |
| HomePage 熱門區塊 | 需新增「熱門產品」精選區塊 + API 查詢 | ⚠️ 需新增 |
| `fetchHotProducts()` API | 需新增 Supabase query 過濾 tagged products | ⚠️ 需新增 |

---

## 🏷 優先級與複雜度

| 項目 | 評級 | 說明 |
|------|------|------|
| **MoSCoW 優先級** | 🟡 **Should** | 提升前台轉換率與使用者體驗，非必須但價值高 |
| **T-shirt Size** | **S** | 資料庫 migration + 前後端標籤邏輯 + UI 徽章 |
| **預估工時** | **2-4 人天** | DB migration 0.5d + 後端 API 0.5d + 前端表單+徽章 1d + 首頁區塊 0.5d + 測試 0.5d |

---

## 🧪 測試情境建議（Test Scenarios）

| 測試案例 | 類型 | 說明 |
|---------|------|------|
| 後台勾選「熱門」→ 前台顯示徽章 | Happy Path | 端到端驗證 |
| 新建立產品 30 天內顯示新品徽章 | Time-based | 第 30 天與第 31 天行為正確 |
| 同時標記熱門 + 新品 | Integration | 兩個徽章並排顯示 |
| 取消標籤後前台不顯示 | Regression | 確認徽章消失 |
| 首頁熱門區塊載入速度 | Performance | API query 使用 index 加速 |

---

## 📝 實作建議

1. **資料庫 Migration**：
   ```sql
   -- 方式 A：使用 TEXT array（較簡單）
   ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';

   -- 方式 B：新增 product_tags 多對多表（較正規，便於未來分析）
   CREATE TABLE product_tags (
     product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
     tag        TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (product_id, tag)
   );
   ```

2. **前端型別擴充**：
   ```ts
   export interface Product {
     // ... 現有欄位
     tags?: string[]
     /** 前端計算：是否為新品（created_at ≤ 30 天） */
     isNew?: boolean
   }
   ```

3. **徽章元件**：建立 `ProductBadge.tsx` 統一管理所有標籤樣式與邏輯
4. **顏色方案**：
   - 🆕 新品 → 綠色背景 `#10b981` + 白色文字
   - 🔥 熱門 → 橙色背景 `#f59e0b` + 白色文字
   - 特價 → 紅色背景 `#ef4444` + 白色文字
