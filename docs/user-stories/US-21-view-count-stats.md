# User Story：產品瀏覽次數統計

## 📌 基本資訊

| 欄位 | 內容 |
|------|------|
| **故事 ID** | US-21 |
| **建立日期** | 2026-07-19 |
| **對應專案** | EasyShow（建材產品目錄網站） |
| **標籤** | `後台` `分析` `統計` `儀表板` |

---

## 🎯 User Story

**As a** 店家管理者（建材行老闆／行銷人員）
**I want** 在後台儀表板與產品列表看到每個產品的瀏覽次數
**So that** 我可以知道哪些產品最受客戶關注，據此調整展示策略、庫存備貨與行銷重點

---

## 📐 技術脈絡

- 目前無任何瀏覽追蹤機制
- 需新增：
  - **資料庫表**：`product_page_views` 記錄每次瀏覽事件
  - **後端 API**：記錄瀏覽（POST）與查詢統計（GET）
  - **前端整合**：產品詳情頁載入時發送瀏覽記錄
  - **後台顯示**：儀表板趨勢 + 產品列表欄位
- 考量建材網站特性，瀏覽量不需即時更新（可接受 1-5 分鐘延遲），避免對前台效能造成影響

---

## ✅ 驗收條件（Acceptance Criteria）

### AC-01：瀏覽事件自動記錄
**Given** 任何訪客（含未登入）瀏覽產品詳情頁 `/product/:id`
**When** 頁面載入完成後 1 秒
**Then** 系統在背景發送一個 POST 請求記錄本次瀏覽事件，包含：
- `product_id`
- `viewed_at`（伺服器時間戳）
- `visitor_id`（匿名識別，使用 session/cookie 或 fingerprint）

### AC-02：不重複計算同一 session 的連續瀏覽
**Given** 同一訪客在 30 分鐘內反覆重新整理或來回進出同一個產品頁面
**When** 瀏覽事件送出
**Then** 系統合併為同一 session 內的連續瀏覽，只計為 1 次不重複瀏覽（Unique View）
**And** 保留總瀏覽次數（Page Views）與不重複訪客數（Unique Visitors）兩種統計

### AC-03：後台產品列表顯示瀏覽次數
**Given** 我在後台產品管理頁
**When** 產品列表載入完成
**Then** 每一列產品新增「瀏覽次數」欄位，顯示「總瀏覽次數 / 不重複訪客數」（例如 `1,234 / 856`）

### AC-04：後台可依瀏覽次數排序
**Given** 我在後台產品管理頁
**When** 我點擊「瀏覽次數」欄位標題
**Then** 產品列表依瀏覽次數降冪排序，再次點擊切換為升冪

### AC-05：後台儀表板顯示熱門產品 Top 10
**Given** 我登入後台首頁（儀表板）
**When** 頁面載入完成
**Then** 我看到「📊 熱門產品 Top 10」區塊，列出瀏覽次數最高的前 10 項產品及其瀏覽數

### AC-06：後台儀表板顯示瀏覽趨勢圖
**Given** 我登入後台儀表板
**When** 頁面載入完成
**Then** 我看到「📈 近 7 日瀏覽趨勢」簡易折線圖，以日期為 X 軸、瀏覽次數為 Y 軸

### AC-07：前台不顯示瀏覽次數
**Given** 一般訪客在前台瀏覽產品詳情頁
**When** 頁面渲染完成
**Then** 瀏覽次數**不**顯示給訪客，僅作為後台分析資料

---

## ⚠️ 邊界案例（Edge Cases）

| 編號 | 情境 | 預期行為 |
|------|------|---------|
| EC-01 | 產品尚未有任何瀏覽 | 後台顯示「0 / 0」或「尚無資料」 |
| EC-02 | 管理者瀏覽自己的產品詳情頁 | 也計入瀏覽次數（可由管理者過濾條件後續考量） |
| EC-03 | 搜尋引擎 bot（Googlebot）爬取產品頁 | 透過 User-Agent 偵測跳過記錄，避免灌水 |
| EC-04 | 短時間內大量惡意刷瀏覽（DDoS） | Rate limit：同一 IP 每分鐘最多記錄 30 次瀏覽 |
| EC-05 | 瀏覽資料量過大（數百萬筆） | 統計 API 使用彙總表（materialized view）或定期彙總至 `product_daily_stats` |
| EC-06 | 訪客使用無痕模式或清除 Cookie | 每次視為新訪客（Unique Visitor 增加），不影響總瀏覽數計算 |
| EC-07 | 產品被刪除 | 該產品的瀏覽記錄也應一併清除（ON DELETE CASCADE）或保留匿名統計 |

---

## ⚡ 非功能性需求（NFR）

| 類別 | 需求描述 | 驗收標準 |
|------|---------|---------|
| 效能 | 瀏覽記錄寫入 | 非同步背景發送，不影響前台頁面載入時間 |
| 效能 | 統計查詢 API | 儀表板 Top 10 查詢 < 500ms（10 萬筆瀏覽記錄內） |
| 可擴充性 | 資料歸檔機制 | 超過 6 個月的原始資料可自動彙總至日統計表，原始資料歸檔 |
| 隱私 | 匿名追蹤 | 不記錄 IP、不儲存個人識別資訊，僅使用匿名 visitor_id |
| 隱私 | GDPR / 個資法 | 網站需有 Privacy Policy 說明瀏覽統計資料的收集方式 |

---

## 🔗 依賴條件（Dependencies）

| 依賴項目 | 說明 | 狀態 |
|---------|------|------|
| `product_page_views` 資料表 | 儲存瀏覽記錄（product_id, visitor_id, viewed_at） | ❌ 需新增 |
| 瀏覽事件 API | `POST /api/track-view` 與 `GET /api/product-stats` | ❌ 需新增 |
| 匿名訪客識別機制 | 使用 `crypto.randomUUID()` 存於 sessionStorage 或 cookie | ⚠️ 需實作 |
| 後台 DashboardPage | 需新增熱門 Top 10 + 趨勢圖區塊 | ⚠️ 需修改 |
| 後台 ProductsPage 表格 | 需新增「瀏覽次數」欄位 | ⚠️ 需修改 |
| 產品詳情頁 ProductDetailPage | 需在 `useEffect` 中發送追蹤請求 | ⚠️ 需修改 |
| 圖表套件 | 趨勢圖可使用輕量 Chart.js / recharts / 或純 CSS 柱狀圖 | ⚠️ 需評估 |

---

## 🏷 優先級與複雜度

| 項目 | 評級 | 說明 |
|------|------|------|
| **MoSCoW 優先級** | 🟡 **Should** | 非核心功能，但對經營決策有幫助；可先做基礎版（僅計數無圖表） |
| **T-shirt Size** | **M** | 需資料庫 migration + API + 前後端串接 + 圖表 |
| **預估工時** | **3-6 人天** | DB 設計 0.5d + API 1d + 前端追蹤 0.5d + 後台顯示 1d + 圖表 1d + 測試 1d |

---

## 🧪 測試情境建議（Test Scenarios）

| 測試案例 | 類型 | 說明 |
|---------|------|------|
| 訪客瀏覽產品詳情頁 1 次 | Happy Path | 總瀏覽 +1，不重複訪客 +1 |
| 同訪客 5 分鐘內瀏覽同產品 3 次 | Session | 總瀏覽 +3，不重複訪客 +1 |
| 10 個不同訪客瀏覽同產品 | Integration | 總瀏覽 10，不重複訪客 10 |
| 後台儀表板 Top 10 排序正確 | 驗證 | 瀏覽最多的產品排在第一位 |
| Googlebot 爬取產品頁 | Bot Filtering | 瀏覽次數不增加 |
| 刪除產品後瀏覽記錄清除 | Data Integrity | 無 orphan records |

---

## 📝 實作建議

1. **資料庫 Migration**：
   ```sql
   CREATE TABLE product_page_views (
     id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     visitor_id TEXT NOT NULL,          -- 匿名辨識符（UUID v4）
     viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     session_id TEXT NOT NULL DEFAULT '' -- session 辨識，用於去重
   );

   CREATE INDEX idx_views_product_id ON product_page_views(product_id);
   CREATE INDEX idx_views_viewed_at ON product_page_views(viewed_at);
   CREATE INDEX idx_views_visitor_session ON product_page_views(visitor_id, session_id, product_id);
   ```

2. **去重邏輯（SQL 範例）**：
   ```sql
   -- 總瀏覽次數
   SELECT COUNT(*) FROM product_page_views WHERE product_id = $1;

   -- 不重複訪客數（以 visitor_id 去重）
   SELECT COUNT(DISTINCT visitor_id) FROM product_page_views WHERE product_id = $1;

   -- 不重複 Session 瀏覽（同一 visitor + session + product 只算一次）
   SELECT COUNT(DISTINCT (visitor_id, session_id, product_id))
   FROM product_page_views
   WHERE product_id = $1;
   ```

3. **前端追蹤**：建立 `useTrackView` hook：
   ```ts
   function useTrackView(productId: number) {
     useEffect(() => {
       const timer = setTimeout(() => {
         // 非同步 POST，不 await
         fetch('/api/track-view', {
           method: 'POST',
           body: JSON.stringify({ productId, visitorId, sessionId }),
         }).catch(() => {})
       }, 1000) // 延遲 1 秒，不影響核心渲染
       return () => clearTimeout(timer)
     }, [productId])
   }
   ```

4. **API 路由**：若使用 Vercel Serverless Functions，建立 `/api/track-view.ts` 與 `/api/product-stats.ts`
5. **圖表建議**：初期可使用純 CSS 橫條圖（無需額外套件），後續再升級為 recharts
