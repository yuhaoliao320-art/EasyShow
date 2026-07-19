@lazyload @frontend @performance @p0 @US-10
Feature: 響應式圖片懶加載
  作為一個用手機或低速網路瀏覽的訪客
  我希望產品圖片能延遲加載（Lazy Loading），載入時有漸進式佔位效果
  以便頁面開啟速度更快，節省行動網路流量，瀏覽體驗更順暢

  Background:
    Given 我使用 Chrome 瀏覽器
    And 網路模擬為 Regular 3G
    And 我在分類頁面，頁面中包含 20 項產品圖片

  @lazyload-happy-path @smoke
  Scenario: 視口外的圖片使用 lazy loading 不立即載入
    Given 頁面正在載入
    When 我檢視瀏覽器開發者工具的 Network 分頁
    Then 僅視口（viewport）內的圖片發送了網路請求
    And 視口外的圖片請求未被觸發
    And 視口外的 `<img>` 標籤包含 `loading="lazy"` 屬性

  @lazyload-happy-path
  Scenario: 滾動至視口時圖片開始載入
    Given 頁面已載入完成，視口外圖片尚未載入
    When 我向下滾動頁面，使原本在視口外的圖片進入視口
    Then 該圖片自動開始載入
    And 圖片載入後以淡入（fade-in）動畫顯示，持續約 300ms

  @lazyload-happy-path
  Scenario: 圖片載入中顯示骨架佔位
    Given 頁面載入中
    When 我檢視尚未載入完成的圖片區域
    Then 圖片位置顯示 CSS skeleton / shimmer 動畫佔位
    And 佔位區域的尺寸與實際圖片比例一致（無版面跳動）

  @lazyload-error-handling
  Scenario: 圖片載入失敗顯示預設佔位圖
    Given 有一張圖片的 URL 失效（回傳 404）
    When 頁面載入完成
    Then 該圖片區域顯示統一的「圖片無法載入」預設佔位圖
    And 佔位圖上沒有瀏覽器預設的破圖 icon

  @lazyload-happy-path
  Scenario: 產品詳情頁主圖使用 eager 優先載入
    Given 我在產品詳情頁
    When 頁面載入時
    Then 第一張主圖的 `<img>` 使用 `loading="eager"`
    And 其餘縮圖使用 `loading="lazy"`

  @lazyload-happy-path
  Scenario: 水平捲動區域使用 Intersection Observer 觸發載入
    Given 我在分類頁的水平產品列（HorizontalProductCard）
    When 我向右捲動查看更多產品
    Then 僅當前顯示區域 + 前後各 1 張圖片的請求被觸發
    And 其餘隱藏圖片保持 lazy 狀態

  @lazyload-edge-case @compatibility
  Scenario: 不支援 loading="lazy" 的瀏覽器正常降級
    Given 我使用 Safari 15.0（不支援原生 lazy loading）
    When 我進入分類頁面
    Then 所有圖片正常載入（fallback to eager）
    And 頁面功能不受影響

  @lazyload-edge-case
  Scenario: 圖片 URL 為空字串時直接顯示佔位圖
    Given 有一項產品的 image_url 為空字串
    When 產品卡片渲染時
    Then 圖片區域直接顯示 broken placeholder
    And 瀏覽器不發送任何圖片請求

  @lazyload-performance
  Scenario: 首次載入的圖片請求數不超過 6 張
    Given 我在分類頁面（含 20 項產品，每項 1 張圖片）
    When 我清除瀏覽器快取並重新載入頁面
    Then Network 分頁中發起的圖片請求 ≤ 6 個

  @lazyload-accessibility
  Scenario: 螢幕閱讀器可正確讀出圖片 alt 文字
    Given 我在分類頁面
    When 我使用 VoiceOver / TalkBack 瀏覽頁面
    Then 所有圖片（含 lazy load 圖片）的 `alt` 屬性被正確讀出
    And 載入中的圖片不影響螢幕閱讀器的正常操作
