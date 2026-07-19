# User Story：分類頁無限滾動 / 載入更多

## 📌 基本資訊

| 欄位 | 內容 |
|------|------|
| **故事 ID** | US-11 |
| **建立日期** | 2026-07-19 |
| **對應專案** | EasyShow（建材產品目錄網站） |
| **標籤** | `前台` `UX` `效能` `分頁` |

---

## 🎯 User Story

**As a** 瀏覽大量產品的訪客（設計師、工班統包）
**I want** 分類頁往下滑時自動載入更多產品，或點擊「載入更多」按鈕
**So that** 我不需要手動換頁，瀏覽體驗更流暢，且頁面初始載入速度更快

---

## 📐 技術脈絡

- 目前 `CategoryPage` 與 `AllCategoriesPage` 透過 `fetchProductsByCategoryIds()` 一次性載入所有已上架產品
- 頁面採用 3 層階層結構（Major → Mid → Small），每層可展開/收合
- Small 層級使用 `HorizontalProductCard` 水平捲動展示產品卡片
- 當產品數量多（如超過 100 項）時，一次性載入會造成：
  - API 回應時間增加
  - 瀏覽器渲染大量 DOM 節點，互動卡頓
  - 手機版記憶體消耗高

---

## ✅ 驗收條件（Acceptance Criteria）

### AC-01：初始載入筆數限制
**Given** 我進入分類頁面或全部分類頁面
**When** 頁面初次載入完成
**Then** 每個 Small 分類區域最多顯示 **前 12 項**產品，其餘隱藏（或顯示為灰色佔位）

### AC-02：自動無限滾動（Infinite Scroll）
**Given** 我在某個 Small 分類區域已載入 12 項產品
**When** 我捲動到該區域的最後一項產品進入視口（viewport）
**Then** 系統自動載入下一批 12 項產品並追加顯示，直到該分類所有產品載入完畢

### AC-03：「載入更多」按鈕（Fallback）
**Given** 自動滾動載入因某些原因未觸發
**When** 使用者在產品列表底部看到「載入更多」按鈕
**Then** 點擊按鈕後載入下一批產品，按鈕文字變為「載入中…」

### AC-04：載入中的視覺回饋
**Given** 我正在載入更多產品
**When** 請求發送中
**Then** 列表底部顯示旋轉 loading spinner 或骨架佔位卡片（2~3 張），讓使用者知道內容正在載入

### AC-05：全部載入完畢提示
**Given** 該 Small 分類的所有產品已全部載入
**When** 使用者滾動到最後
**Then** 顯示「已顯示全部 N 項產品」，不再觸發載入

### AC-06：展開/收合不重置載入狀態
**Given** 我已載入某 Small 分類的 24 項產品（2 批）
**When** 我收合該分類區域後再次展開
**Then** 已載入的 24 項產品仍在，不需重新載入

---

## ⚠️ 邊界案例（Edge Cases）

| 編號 | 情境 | 預期行為 |
|------|------|---------|
| EC-01 | 該 Small 分類產品數 ≤ 12 | 直接顯示全部，不顯示 loading spinner 或「載入更多」 |
| EC-02 | 快速連續展開多個 Small 分類 | 每個分類的載入請求獨立進行，不互相阻塞 |
| EC-03 | 網路中斷時載入 | 顯示「載入失敗，請重試」提示與重試按鈕 |
| EC-04 | 切換到其他頁面又返回 | 返回時應恢復先前的載入狀態（可透過 sessionStorage 或元件狀態保留） |
| EC-05 | 所有 Small 分類都沒有產品 | 顯示「此分類尚無產品」空狀態 |
| EC-06 | 載入過程中收合該區域 | 應中止進行中的 API 請求（使用 AbortController） |

---

## ⚡ 非功能性需求（NFR）

| 類別 | 需求描述 | 驗收標準 |
|------|---------|---------|
| 效能 | 單次 API 請求回傳筆數 | 每批 12 筆（含 product_images join） |
| 效能 | API 回應時間 | 每批 < 300ms |
| 效能 | 頁面初始 DOM 節點數 | 減少 ≥ 60%（相比一次性載入全部） |
| 可用性 | 載入時不影響頁面滾動 | 內容追加不造成頁面跳動 |
| 記憶體 | 已收合區域的 DOM 節點 | 可考慮在收合時卸載不可見的產品卡片（虛擬化），保留資料狀態 |

---

## 🔗 依賴條件（Dependencies）

| 依賴項目 | 說明 | 狀態 |
|---------|------|------|
| `fetchProductsByCategoryIds()` API | 需改為支援分頁參數 `limit, offset` | ⚠️ 需改造 |
| `HorizontalProductCard` 列表 | 需加入 Intersection Observer 偵測底部 | ⚠️ 需改造 |
| `SmallRow` 元件 | `products` 從「全部陣列」改為「逐步累加」的狀態管理 | ⚠️ 需改造 |

---

## 🏷 優先級與複雜度

| 項目 | 評級 | 說明 |
|------|------|------|
| **MoSCoW 優先級** | 🟡 **Should** | 產品數超過 50 項後才迫切需要，可依實際資料量決定 |
| **T-shirt Size** | **M** | 需改造 API + 前端狀態管理 + Intersection Observer 實作 |
| **預估工時** | **3-5 人天** | API 分頁改造 1d + 前端 Infinite Scroll hook 1d + SmallRow 改寫 1d + 測試 1d |

---

## 🧪 測試情境建議（Test Scenarios）

| 測試案例 | 類型 | 說明 |
|---------|------|------|
| 產品數 13 項（剛好超過一批） | Edge Case | 第二批次應正確載入 |
| 產品數 24 項（剛好兩批） | Edge Case | 載入兩批後顯示完畢提示 |
| 快速收合 → 展開 → 收合 | Error Handling | 不應發送重複請求或遺失資料 |
| 手機裝置低速網路 | Performance | spinner 應正常顯示，不卡頓 |
| 同時展開 3 個 Small 分類 | Concurrency | 每個分類獨立分頁載入 |

---

## 📝 實作建議

1. **建立 `useInfiniteScroll` Hook**：
   ```tsx
   function useInfiniteScroll(containerRef: RefObject<HTMLDivElement>, options: {
     threshold?: number
     initialSize: number
     pageSize: number
   }): { items: Product[]; loadMore: () => void; hasMore: boolean; loading: boolean }
   ```
2. **API 改造**：`fetchProductsByCategoryIds(ids, { limit, offset })`，使用 Supabase `.range()`
3. **避免記憶體洩漏**：在 `useEffect` cleanup 中呼叫 `AbortController.abort()`
4. **虛擬滾動（未來優化）**：若單一 Small 分類超過 100 項產品，可考慮引入 `react-window` 進行 DOM 虛擬化
