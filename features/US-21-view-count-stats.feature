@view-count @admin @analytics @dashboard @p1 @US-21
Feature: 產品瀏覽次數統計
  作為一個店家管理者（建材行老闆／行銷人員）
  我希望在後台儀表板與產品列表看到每個產品的瀏覽次數
  以便我知道哪些產品最受客戶關注，據此調整展示策略、庫存備貨與行銷重點

  Background:
    Given 資料庫中已有以下產品:
      | id | name     |
      | 1  | 石英磚   |
      | 2  | 木紋磚   |
      | 3  | 超耐磨地板 |
    And 瀏覽記錄表中已有以下資料:
      | product_id | visitor_id | viewed_at               |
      | 1          | v-a        | 2026-07-18 10:00:00+00 |
      | 1          | v-a        | 2026-07-18 10:05:00+00 |  <-- 同一訪客，同一 session
      | 1          | v-b        | 2026-07-18 11:00:00+00 |
      | 2          | v-c        | 2026-07-18 12:00:00+00 |
    And 石英磚（id=1）的統計為: 總瀏覽 3 次，不重複訪客 2 人

  @viewcount-happy-path @smoke
  Scenario: 訪客瀏覽產品詳情頁時自動記錄
    Given 我是一位匿名訪客（未登入）
    When 我進入產品「石英磚」的詳情頁 "/product/1"
    Then 頁面載入完成 1 秒後，背景發送 POST 請求記錄瀏覽事件
    And 請求內容包含 product_id=1 與 visitor_id（UUID 格式）

  @viewcount-business-rule
  Scenario: 同一 session 內不重複計算不重複訪客
    Given 訪客 v-a 在 30 分鐘內重新整理「石英磚」頁面 3 次
    When 瀏覽事件送出
    Then 總瀏覽次數增加 3
    But 不重複訪客數僅增加 0（同一訪客已在 session 中）
    And 石英磚的最終統計為: 總瀏覽 6 次，不重複訪客 2 人

  @viewcount-happy-path
  Scenario: 後台產品列表顯示瀏覽次數字段
    Given 我登入後台
    When 我進入產品管理頁
    Then 產品列表中每一列新增「瀏覽次數」欄位
    And 石英磚顯示「3 / 2」（總瀏覽 / 不重複訪客）
    And 木紋磚顯示「1 / 1」
    And 超耐磨地板顯示「0 / 0」

  @viewcount-happy-path
  Scenario: 後台產品列表可按瀏覽次數排序
    Given 我在後台產品管理頁
    When 我點擊「瀏覽次數」欄位標題
    Then 產品列表依瀏覽次數降冪排序
    And 排序為: 石英磚（3）→ 木紋磚（1）→ 超耐磨地板（0）
    When 我再次點擊「瀏覽次數」欄位標題
    Then 產品列表切換為升冪排序

  @viewcount-happy-path
  Scenario: 後台儀表板顯示熱門產品 Top 10
    Given 我登入後台
    When 我進入儀表板頁面
    Then 我看到「📊 熱門產品 Top 10」區塊
    And 區塊依瀏覽次數由高至低列出產品
    And 排名第一為「石英磚（3 次瀏覽）」

  @viewcount-happy-path
  Scenario: 後台儀表板顯示近 7 日瀏覽趨勢圖
    Given 後台有過去 7 天的瀏覽記錄
    When 我進入儀表板頁面
    Then 我看到「📈 近 7 日瀏覽趨勢」圖表
    And 圖表 X 軸為日期，Y 軸為瀏覽次數
    And 圖表類型為折線圖

  @viewcount-business-rule
  Scenario: 前台不顯示瀏覽次數
    Given 我是一般訪客
    When 我在前台瀏覽任何產品詳情頁
    Then 頁面上看不到瀏覽次數相關資訊
    And 瀏覽次數僅在後台顯示

  @viewcount-error-handling
  Scenario: 搜尋引擎 bot 不計入瀏覽次數
    Given 我模擬 Googlebot 的 User-Agent 請求產品詳情頁
    When 頁面載入完成
    Then 系統偵測到 bot 請求
    And 不記錄瀏覽事件
    And 瀏覽次數不增加

  @viewcount-security
  Scenario: 短時間大量請求被 Rate Limit
    Given 同一 IP 在 1 秒內連續發送 50 次瀏覽記錄請求
    When 瀏覽事件 API 處理請求
    Then 僅前 30 次請求被成功記錄
    And 第 31 次起回傳 429 Too Many Requests
    And 伺服器回傳錯誤訊息「請求過於頻繁，請稍後再試」

  @viewcount-happy-path
  Scenario: 產品刪除後瀏覽記錄自動清除
    Given 產品「石英磚」有 3 筆瀏覽記錄
    When 管理者刪除「石英磚」
    Then 資料庫中石英磚的產品記錄被刪除
    And 石英磚的瀏覽記錄也因 CASCADE 被自動清除
    And 後台儀表板 Top 10 不再包含石英磚

  @viewcount-edge-case
  Scenario: 產品無任何瀏覽時顯示「尚無資料」
    Given 產品「超耐磨地板」從未被瀏覽過
    When 我在後台產品管理頁
    Then 超耐磨地板的「瀏覽次數」欄位顯示「0 / 0」
    When 我在後台儀表板
    Then 超耐磨地板未出現在 Top 10 列表中
