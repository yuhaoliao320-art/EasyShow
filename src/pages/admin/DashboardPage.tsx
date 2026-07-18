import React, { useEffect, useState } from 'react'
import { fetchAllCategories } from '../../api/categories'
import { fetchAllProducts } from '../../api/products'
import { buildCategoryTree } from '../../types'

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    maxDepth: 0,
  })

  useEffect(() => {
    Promise.all([fetchAllCategories(), fetchAllProducts()]).then(
      ([categories, products]) => {
        const tree = buildCategoryTree(categories)
        const maxDepth = getMaxDepth(tree)
        setStats({
          categories: categories.length,
          products: products.length,
          maxDepth,
        })
      }
    )
  }, [])

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
