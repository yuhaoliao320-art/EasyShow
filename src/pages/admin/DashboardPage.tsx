import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllCategories } from '../../api/categories'
import { fetchAllProducts, fetchTopViewedProducts, fetchDailyViewTrend } from '../../api/products'
import { buildCategoryTree } from '../../types'

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    maxDepth: 0,
  })
  const [topProducts, setTopProducts] = useState<{ product_id: number; views: number }[]>([])
  const [trend, setTrend] = useState<{ date: string; views: number }[]>([])
  const [productNames, setProductNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAllCategories(),
      fetchAllProducts(),
      fetchTopViewedProducts(10),
      fetchDailyViewTrend(7),
    ]).then(([categories, products, top, trendData]) => {
      const tree = buildCategoryTree(categories)
      const maxDepth = getMaxDepth(tree)
      setStats({
        categories: categories.length,
        products: products.length,
        maxDepth,
      })
      setTopProducts(top)
      setTrend(trendData)

      const nameMap: Record<number, string> = {}
      for (const p of products) {
        nameMap[p.id] = p.name
      }
      setProductNames(nameMap)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const maxTrendViews = Math.max(...trend.map((d) => d.views), 1)

  return (
    <div className="dashboard-page">
      <h1>儀表板</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.categories}</div>
          <div className="stat-label">全部分類</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.products}</div>
          <div className="stat-label">全部產品</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.maxDepth}</div>
          <div className="stat-label">最大分類深度</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 熱門產品 Top 10 */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">📊 熱門產品 Top 10</h2>
          {topProducts.length === 0 ? (
            <p className="dashboard-empty">尚無瀏覽資料</p>
          ) : (
            <ol className="dashboard-top-list">
              {topProducts.map((item, idx) => (
                <li key={item.product_id} className="dashboard-top-item">
                  <span className="dashboard-top-rank">{idx + 1}</span>
                  <Link
                    to={`/admin/products/edit/${item.product_id}`}
                    className="dashboard-top-name"
                  >
                    {productNames[item.product_id] || `產品 #${item.product_id}`}
                  </Link>
                  <span className="dashboard-top-views">{item.views} 次瀏覽</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 近 7 日瀏覽趨勢 */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">📈 近 7 日瀏覽趨勢</h2>
          {trend.length === 0 ? (
            <p className="dashboard-empty">尚無瀏覽資料</p>
          ) : (
            <div className="dashboard-trend-chart">
              {trend.map((day) => (
                <div key={day.date} className="dashboard-trend-bar-group">
                  <div className="dashboard-trend-bar-wrapper">
                    <div
                      className="dashboard-trend-bar"
                      style={{
                        height: `${Math.max((day.views / maxTrendViews) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className="dashboard-trend-label">
                    {day.date.slice(5)}
                  </span>
                  <span className="dashboard-trend-value">{day.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getMaxDepth(tree: any[]): number {
  let max = 0
  const walk = (nodes: any[], depth: number) => {
    for (const n of nodes) {
      max = Math.max(max, depth + 1)
      walk(n.children || [], depth + 1)
    }
  }
  walk(tree, 0)
  return max
}

export default DashboardPage
