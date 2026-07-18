import React, { useEffect, useState } from 'react'
import { fetchAllCategories } from '../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../types'
import CategoryTree from '../components/CategoryTree'

const HomePage: React.FC = () => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllCategories()
      .then((categories) => {
        const t = buildCategoryTree(categories)
        setTree(t)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">載入中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>建材產品目錄</h1>
        <p>請選擇分類瀏覽產品</p>
      </div>

      {tree.length === 0 ? (
        <div className="empty-state">
          <p>目前尚無任何分類</p>
        </div>
      ) : (
        <div className="home-tree">
          <CategoryTree tree={tree} />
        </div>
      )}
    </div>
  )
}

export default HomePage
