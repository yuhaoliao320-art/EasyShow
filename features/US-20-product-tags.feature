@product-tags @frontend @admin @marketing @p1 @US-20
Feature: 熱門產品 / 新品標籤
  作為一個前台瀏覽訪客與後台管理者
  我希望產品能標記「熱門」「新品」等標籤，並在前台卡片上顯示對應徽章
  以便管理者可以推薦重點產品，訪客能優先瀏覽店家推薦或最新商品

  Background:
    Given 資料庫中已建立以下已上架產品:
      | name       | tags          | created_at               |
      | 石英磚     | {hot}         | 2026-07-01 10:00:00+00   |
      | 木紋磚     | {hot, sale}   | 2026-07-15 10:00:00+00   |
      | 超耐磨地板 | {}            | 2026-07-19 10:00:00+00   |  <-- 今日建立，視為新品
      | 海島型地板 | {}            | 2026-05-01 10:00:00+00   |  <-- 超過 30 天，無標籤

  @tags-happy-path @smoke
  Scenario: 後台管理者可為產品勾選標籤
    Given 我登入後台
    When 我在新增產品表單中
    Then 我看到「產品標籤」區域
    And 包含可勾選項目：「🔥 熱門」「🆕 新品」「特價」
    When 我勾選「🔥 熱門」
    And 我填寫產品名稱並儲存
    Then 產品建立成功
    When 我重新進入該產品的編輯頁面
    Then 「🔥 熱門」選項已預先勾選

  @tags-happy-path
  Scenario: 前台顯示「🔥 熱門」徽章
    Given 產品「石英磚」已被標記為熱門
    When 我在首頁或分類頁看到「石英磚」的產品卡片
    Then 卡片右上角顯示橙色「🔥 熱門」徽章
    And 徽章不遮擋產品主要圖片與名稱

  @tags-happy-path
  Scenario: 新建立產品自動顯示「🆕 新品」徽章
    Given 產品「超耐磨地板」建立於 2026-07-19（今天）
    When 前台渲染產品卡片
    Then 卡片右上角顯示綠色「🆕 新品」徽章
    And 無需管理者手動標記

  @tags-edge-case
  Scenario: 超過 30 天的產品不顯示新品徽章
    Given 產品「海島型地板」建立於 2026-05-01（距今超過 30 天）
    When 前台渲染產品卡片
    Then 卡片上不顯示「🆕 新品」徽章

  @tags-happy-path
  Scenario: 多標籤疊加顯示
    Given 產品「木紋磚」同時被標記為「熱門」且有「特價」標籤
    When 前台渲染產品卡片
    Then 卡片右上角依序顯示「🆕 新品」（若符合）、「🔥 熱門」、「特價」徽章
    And 徽章由左至右排列，不重疊

  @tags-happy-path
  Scenario: 首頁顯示「熱門產品」精選區塊
    Given 有至少 2 項產品被標記為「熱門」
    When 我進入網站首頁
    Then 我看到「🔥 熱門產品」精選區塊
    And 區塊內展示最多 8 項被標記為熱門的產品
    And 區塊位於 hero banner 下方、全部分類上方

  @tags-edge-case
  Scenario: 產品無任何標籤且非新品時不顯示徽章
    Given 產品未標記任何標籤且建立超過 30 天
    When 前台渲染產品卡片
    Then 卡片上不顯示任何徽章
    And 卡片保持簡潔外觀

  @tags-regression
  Scenario: 管理者取消標籤後前台徽章消失
    Given 產品「石英磚」原本被標記為「熱門」
    When 管理者在編輯頁面取消勾選「🔥 熱門」
    And 儲存變更
    Then 前台「石英磚」卡片不再顯示熱門徽章

  @tags-edge-case
  Scenario: 新產品未上架即使為新品也不顯示徽章
    Given 產品建立於今日但 `is_published = false`
    When 前台瀏覽頁面
    Then 該產品不出現在前台任何頁面
    And 其新品徽章不被渲染

  @tags-business-rule
  Scenario: 建立第 30 天仍顯示新品，第 31 天自動移除
    Given 產品建立於 2026-06-19（UTC）
    When 系統日期為 2026-07-19（UTC，第 30 天）
    Then 前台顯示「🆕 新品」徽章
    When 系統日期為 2026-07-20（UTC，第 31 天）
    Then 前台不再顯示「🆕 新品」徽章
