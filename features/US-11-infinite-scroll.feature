@infinite-scroll @frontend @performance @pagination @p1 @US-11
Feature: 分類頁無限滾動 / 載入更多
  作為一個瀏覽大量產品的訪客（設計師、工班統包）
  我希望分類頁往下滑時自動載入更多產品，或點擊「載入更多」按鈕
  以便我不需要手動換頁，瀏覽體驗更流暢，且頁面初始載入速度更快

  Background:
    Given 我在全部分類頁面
    And 某 Small 分類「石英磚」共有 25 項已上架產品
    And 系統每批載入 12 項產品

  @infinite-scroll-happy-path @smoke
  Scenario: 進入頁面時僅載入第一批產品
    Given 我首次進入分類頁面
    When 頁面載入完成
    Then 該 Small 分類僅顯示前 12 項產品
    And 列表底部未顯示「已顯示全部」提示

  @infinite-scroll-happy-path
  Scenario: 滾動至底部自動載入下一批產品
    Given 該 Small 分類已載入 12 項產品（第一批）
    When 我向下滾動至最後一項產品進入視口
    Then 系統自動載入下一批 12 項產品
    And 新載入的產品追加顯示在列表底部
    And 現在共顯示 24 項產品

  @infinite-scroll-happy-path
  Scenario: 所有產品載入完畢顯示提示
    Given 該 Small 分類已載入 24 項產品（前兩批）
    When 我再次向下滾動至底部
    Then 系統載入最後 1 項產品（第三批）
    And 列表底部顯示「已顯示全部 25 項產品」
    And 不再觸發新的載入請求

  @infinite-scroll-happy-path
  Scenario: 載入中顯示 loading spinner
    Given 該 Small 分類已載入 12 項產品
    When 我向下滾動觸發第二批載入
    Then 在 API 回應前，列表底部顯示旋轉 loading spinner
    And spinner 在載入完成後自動消失

  @infinite-scroll-error-handling
  Scenario: 載入失敗顯示重試按鈕
    Given 該 Small 分類已載入 12 項產品
    And 網路連線中斷
    When 我向下滾動觸發第二批載入
    Then 列表底部顯示「載入失敗，請重試」提示
    And 顯示「重新載入」按鈕
    When 我點擊「重新載入」按鈕
    Then 系統重新發送第二批載入請求

  @infinite-scroll-happy-path
  Scenario: 展開收合不重置載入狀態
    Given 該 Small 分類已載入 24 項產品（兩批）
    When 我點擊收合該 Small 分類區域
    And 再次點擊展開該區域
    Then 仍顯示 24 項產品
    And 不需要重新載入

  @infinite-scroll-edge-case
  Scenario: 產品數不滿一批時直接全部顯示
    Given 另一 Small 分類僅有 5 項產品
    When 頁面初次載入完成
    Then 5 項產品全部顯示
    And 不顯示 loading spinner
    And 不顯示「載入更多」按鈕
    And 列表底部顯示「已顯示全部 5 項產品」

  @infinite-scroll-error-handling
  Scenario: 載入過程中收合區域自動中止請求
    Given 該 Small 分類正在載入第二批產品
    When 我點擊收合該分類區域
    Then 進行中的 API 請求被中止（AbortController）
    When 我再次展開該分類區域
    Then 重新從第一批開始載入

  @infinite-scroll-concurrency
  Scenario: 快速連續展開多個 Small 分類各自獨立載入
    Given 頁面上有 3 個 Small 分類（A、B、C）
    When 我依序展開 A、B、C
    Then 每個分類各自獨立發送載入請求
    And 分類 A 載入失敗不影響分類 B 和 C 的載入

  @infinite-scroll-performance
  Scenario: 返回頁面時恢復先前載入狀態
    Given 我已載入分類 A 的 24 項產品
    When 我導航到產品詳情頁
    And 再按返回按鈕回到分類頁
    Then 分類 A 仍顯示 24 項產品
    And 不需重新載入已載入的產品
