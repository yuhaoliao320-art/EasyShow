import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchAllProducts, deleteProduct } from '../../api/products'
import { fetchAllCategories } from '../../api/categories'
import type { Product, Category } from '../../types'

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filterCatId, setFilterCatId] = useState<string>('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const catFilter = searchParams.get('category_id')
    if (catFilter) setFilterCatId(catFilter)
  }, [searchParams])

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        fetchAllProducts(),
        fetchAllCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此產品？')) return
    try {
      await deleteProduct(id)
      loadData()
    } catch (err: any) {
      alert('刪除失敗：' + err.message)
    }
  }

  const getCategoryName = (catId: number) => {
    return categories.find((c) => c.id === catId)?.name ?? `ID:${catId}`
  }

  // 過濾
  const filtered = products.filter((p) => {
    if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase())) {
      return false
    }
    if (filterCatId && p.category_id !== Number(filterCatId)) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton skeleton-text-lg" />
        <div className="skeleton skeleton-text-sm" style={{ marginBottom: 24 }} />
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    )
  }
  if (error) return <div className="error">{error}</div>

  return (
    <div className="admin-products-page">
      <div className="page-header">
        <h1>產品管理</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          + 新增產品
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜尋產品名稱..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="filter-input"
        />
        <select
          value={filterCatId}
          onChange={(e) => setFilterCatId(e.target.value)}
          className="filter-select"
        >
          <option value="">全部分類</option>
          {categories
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {keyword || filterCatId ? '無符合條件的產品' : '尚未建立任何產品'}
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>縮圖</th>
              <th>名稱</th>
              <th>分類</th>
              <th>狀態</th>
              <th>照片數</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0].image_url}
                      alt={p.name}
                      className="table-thumb-img"
                    />
                  ) : (
                    <div className="table-thumb" />
                  )}
                </td>
                <td>{p.name}</td>
                <td>{getCategoryName(p.category_id)}</td>
                <td>{p.images?.length ?? 0}</td>
                <td>
                  <span
                    className={`status-badge ${
                      p.is_published ? 'published' : 'unpublished'
                    }`}
                  >
                    {p.is_published ? '上架' : '下架'}
                  </span>
                </td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  <Link
                    to={`/admin/products/edit/${p.id}`}
                    className="btn btn-sm"
                  >
                    編輯
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ProductsPage
