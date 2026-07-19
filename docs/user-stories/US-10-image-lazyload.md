# User Story：響應式圖片懶加載

## 📌 基本資訊

| 欄位 | 內容 |
|------|------|
| **故事 ID** | US-10 |
| **建立日期** | 2026-07-19 |
| **對應專案** | EasyShow（建材產品目錄網站） |
| **標籤** | `效能` `前端` `UX` `圖片` |

---

## 🎯 User Story

**As a** 用手機或低速網路瀏覽的訪客
**I want** 產品圖片能延遲加載（Lazy Loading），載入時有漸進式佔位效果
**So that** 頁面開啟速度更快，節省行動網路流量，瀏覽體驗更順暢

---

## 📐 技術脈絡

- 目前前台所有 `<img>` 直接使用 `src` 屬性，頁面載入時會**同步下載所有可見與不可見的圖片**
- 當前在 `CategoryPage` / `AllCategoriesPage` 中，使用 `HorizontalProductCard` 水平捲動展示產品
- 使用 Vite 建置，無需額外 webpack loader 即可支援原生 Lazy Loading
- Supabase Storage 圖片可能尺寸較大，未經優化

---

## ✅ 驗收條件（Acceptance Criteria）

### AC-01：原生 Lazy Loading
**Given** 我瀏覽分類頁面或全部分類頁面
**When** 頁面載入時
**Then** 所有在視口（viewport）之外的產品圖片使用 `loading="lazy"` 屬性，僅在即將進入視口時才開始載入

### AC-02：漸進式佔位效果
**Given** 圖片正在載入中
**When** 圖片尚未載入完成
**Then** 圖片區域顯示一個輕量級的 CSS 佔位骨架（skeleton / shimmer 動畫），而非空白區域或版面跳動

### AC-03：圖片載入完成過渡
**Given** 圖片載入完成
**When** 圖片從佔位狀態切換為實際圖片
**Then** 圖片以淡入（fade-in）動畫（約 300ms）平滑顯示，避免突兀閃現

### AC-04：載入失敗顯示
**Given** 圖片因網路問題或 URL 失效無法載入
**When** 瀏覽器回報載入錯誤
**Then** 圖片區域顯示一個統一的「圖片無法載入」預設佔位圖（broken image placeholder），而非瀏覽器預設的破圖 icon

### AC-05：產品詳情頁主圖
**Given** 我在產品詳情頁
**When** 頁面載入時
**Then** 主圖使用 `loading="lazy"`，但第一張縮圖優先載入（eager）

### AC-06：水平捲動區域的 Intersection Observer
**Given** 我在分類頁的水平產品列（HorizontalProductCard）
**When** 我向右捲動查看更多產品
**Then** 僅當前顯示區域 + 前後各 1 張圖片的請求被觸發，其餘保持 lazy

---

## ⚠️ 邊界案例（Edge Cases）

| 編號 | 情境 | 預期行為 |
|------|------|---------|
| EC-01 | 瀏覽器不支援 `loading="lazy"`（如舊版 Safari） | 使用 Intersection Observer polyfill 或直接載入（fallback to eager） |
| EC-02 | 圖片 URL 為空字串 | 直接顯示 broken placeholder，不發送請求 |
| EC-03 | 使用者快速滾動頁面 | 圖片請求應可被中止（browser native behavior），避免浪費頻寬 |
| EC-04 | 網路切換為 Slow 3G | 圖片依序載入，不應 blocking 其他資源 |
| EC-05 | 離線模式瀏覽 | 已快取的圖片正常顯示，未載入的顯示 placeholder |
| EC-06 | 螢幕閱讀器（VoiceOver / TalkBack） | Lazyload 不影響 `alt` 屬性的讀出，所有圖片皆有有意義的 alt text |

---

## ⚡ 非功能性需求（NFR）

| 類別 | 需求描述 | 驗收標準 |
|------|---------|---------|
| 效能 | 初始頁面載入的圖片請求數 | 首次載入（above-the-fold）圖片請求 ≤ 6 張 |
| 效能 | 頁面 Largest Contentful Paint（LCP） | ≤ 2.5 秒（使用 Lighthouse Mobile 模擬） |
| 效能 | 減少總圖片傳輸量 | 首次載入圖片資料量減少 ≥ 40%（相比無 lazyload） |
| 可用性 | 不影響使用者滾動體驗 | 圖片載入時不造成版面重新佈局（Layout Shift） |
| 維護性 | 元件封裝 | LazyLoad 行為封裝為單一元件 `LazyImage`，統一管理 |

---

## 🔗 依賴條件（Dependencies）

| 依賴項目 | 說明 | 狀態 |
|---------|------|------|
| `ProductCard` / `HorizontalProductCard` | 需修改以使用 `LazyImage` 元件 | ⚠️ 需修改 |
| 產品詳情頁圖庫 | 主圖與縮圖需套用 lazyload | ⚠️ 需修改 |
| Safari 相容性 | 確認 `loading="lazy"` 支援度（Safari 15.4+ 支援） | ⚠️ 需確認目標用戶瀏覽器版本 |

---

## 🏷 優先級與複雜度

| 項目 | 評級 | 說明 |
|------|------|------|
| **MoSCoW 優先級** | 🟢 **Must** | 直接影響 UX 與 Core Web Vitals，SEO 加分 |
| **T-shirt Size** | **S** | 一個通用 `LazyImage` 元件 + 漸進式替換現有 `<img>` |
| **預估工時** | **1-3 人天** | 元件開發 1d + 全站替換 0.5d + 測試驗證 0.5d |

---

## 🧪 測試情境建議（Test Scenarios）

| 測試案例 | 類型 | 說明 |
|---------|------|------|
| 分類頁快速滾動 | Performance | 檢查圖片請求是否按需觸發 |
| 產品詳情頁圖庫切換 | Happy Path | 切換圖片時無閃爍或佈局偏移 |
| 斷網後載入頁面 | Error Handling | 所有圖片顯示 broken placeholder |
| Lighthouse 評測 | Performance | LCP 與 CLS 分數應有改善 |
| Safari 實機測試 | Compatibility | Lazy loading 正常運作 |

---

## 📝 實作建議

1. **建立 `LazyImage` 元件**：
   ```tsx
   // src/components/LazyImage.tsx
   interface LazyImageProps {
     src: string
     alt: string
     className?: string
     placeholderColor?: string
     eager?: boolean  // 強制 eager loading
   }
   ```
2. **骨架樣式**：使用 CSS `@keyframes shimmer` 動畫搭配 `background: linear-gradient()` 產生簡潔的載入佔位
3. **佔位尺寸鎖定**：所有圖片容器需明確設定 `width` + `height` 或 `aspect-ratio`，防止 CLS
4. **CDN 圖片處理**：若未來使用圖片 CDN（如 imgix / Cloudflare Images），可結合 `?w=400&q=80` 參數動態調整尺寸，進一步減少傳輸量
