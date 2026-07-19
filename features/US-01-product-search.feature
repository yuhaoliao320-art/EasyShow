@search @frontend @p0 @US-01
Feature: 產品關鍵字搜尋
  作為一個前台瀏覽訪客（消費者、設計師或工班）
  我希望在網站上輸入關鍵字搜尋產品名稱
  以便快速找到想看的特定材料，不需逐層翻分類

  Background:
    Given 我已在網站前台
    And 資料庫中有以下已上架產品:
      | name     | category |
      | 石英磚   | 瓷磚     |
      | 木紋磚   | 瓷磚     |
      | 超耐磨木地板 | 木地板 |
      | 海島型木地板 | 木地板 |

  @search-happy-path @smoke
  Scenario: 在全域搜尋框輸入關鍵字進行搜尋
    Given 我在首頁
    When 我在 header 的搜尋框中輸入「磁磚」
    And 我按下 Enter 鍵
    Then 系統導航至 "/search?q=磁磚"
    And 頁面標題顯示「搜尋結果」
    And 頁面顯示「搜尋「磁磚」共找到 2 項產品」

  @search-happy-path
  Scenario: 搜尋結果以產品卡片網格正確顯示
    Given 我在搜尋結果頁面，搜尋關鍵字為「地板」
    When 搜尋結果載入完成
    Then 頁面顯示 2 項產品的卡片
    And 每張卡片包含產品名稱、第一張縮圖、所屬分類名稱
    And 卡片可點擊，點擊後導向至對應的產品詳情頁

  @search-edge-case
  Scenario: 搜尋不存在的關鍵字顯示空結果提示
    Given 我在首頁
    When 我在搜尋框中輸入「zzzxxx」
    And 我按下 Enter 鍵
    Then 頁面顯示「找不到符合「zzzxxx」的產品」
    And 頁面提供「瀏覽全部分類」的連結
    And 頁面提示「檢查關鍵字是否有錯字」
    And 頁面提示「嘗試使用更通用的詞彙」

  @search-error-handling
  Scenario: 搜尋空字串不觸發搜尋
    Given 我在首頁
    When 我在搜尋框中未輸入任何文字
    And 我按下 Enter 鍵
    Then 頁面顯示提示「請輸入關鍵字」
    And 頁面停留在目前頁面，未發生導航

  @search-edge-case
  Scenario: 關鍵字前後有空白時自動 trim
    Given 我在首頁
    When 我在搜尋框中輸入「 磁磚 」（前後有空白）
    And 我按下 Enter 鍵
    Then 系統導航至 "/search?q=磁磚"（參數已 trim）
    And 搜尋結果正確顯示 2 項產品

  @search-edge-case @security
  Scenario: 關鍵字包含 HTML 標籤不造成 XSS
    Given 我在首頁
    When 我在搜尋框中輸入「<script>alert('xss')</script>」
    And 我按下 Enter 鍵
    Then 頁面顯示「找不到符合「&lt;script&gt;alert('xss')&lt;/script&gt;」的產品」
    And 瀏覽器未彈出 alert 對話框

  @search-error-handling
  Scenario: 網路中斷時顯示錯誤提示
    Given 我在首頁
    And 網路連線中斷
    When 我在搜尋框中輸入「磁磚」
    And 我按下 Enter 鍵
    Then 頁面顯示「網路異常，請稍後再試」
    And 頁面上出現「重新嘗試」按鈕

  @search-happy-path @mobile
  Scenario: 手機版搜尋框可正常展開與收起
    Given 我在手機版網站的首頁
    When 我點擊搜尋圖示
    Then 搜尋框展開為全寬
    When 我點擊搜尋框外的區域
    Then 搜尋框收起

  @search-happy-path
  Scenario: 點擊清除按鈕清空搜尋框
    Given 我在首頁的搜尋框中已輸入「磁磚」
    When 我點擊搜尋框內的清除按鈕（✕）
    Then 搜尋框文字被清空
    And 游標保持在搜尋框內

  @search-happy-path @navigation
  Scenario: 搜尋結果卡片可導向產品詳情頁
    Given 我在搜尋結果頁面，搜尋關鍵字為「石英磚」
    When 我點擊「石英磚」的產品卡片
    Then 系統導航至該產品的詳情頁 "/product/:id"
    And 產品詳情頁顯示「石英磚」的名稱
