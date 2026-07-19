import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchAllProducts,
  deleteProduct,
  uploadImage,
  updateProductImages,
  fetchProductsViewStats,
} from '../../api/products'
import { fetchAllCategories } from '../../api/categories'
import type { Product, Category } from '../../types'
import ProductFormModal from '../../components/ProductFormModal'

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [viewStats, setViewStats] = useState<
    Record<number, { views: number; unique_visitors: number }>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filterCatId, setFilterCatId] = useState<string>('')
  const [searchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // 批次取得瀏覽統計
      const productIds = prods.map((p) => p.id)
      if (productIds.length > 0) {
        fetchProductsViewStats(productIds).then(setViewStats).catch(() => {})
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUploadClick = (productId: number) => {
    setUploadingProductId(productId)
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || uploadingProductId === null) return

    const pid = uploadingProductId
    setUploadingProductId(pid)

    try {
      const product = products.find((p) => p.id === pid)
      const existingUrls = product?.images?.map((img) => img.image_url) ?? []

      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i])
        existingUrls.push(url)
      }

      await updateProductImages(pid, existingUrls)
      loadData()
    } catch (err: any) {
      alert('上傳失敗：' + err.message)
    } finally {
      setUploadingProductId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          + 新增產品
        </button>
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
              <th>瀏覽次數</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td data-label="縮圖">
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
                <td data-label="名稱">{p.name}</td>
                <td data-label="分類">{getCategoryName(p.category_id)}</td>
                <td data-label="狀態">
                  <span
                    className={`status-badge ${
                      p.is_published ? 'published' : 'unpublished'
                    }`}
                  >
                    {p.is_published ? '上架' : '下架'}
                  </span>
                </td>
                <td data-label="照片數">{p.images?.length ?? 0}</td>
                <td data-label="瀏覽次數">
                  <span className="view-stats-compact">
                    👁 {viewStats[p.id]?.views ?? 0} ({viewStats[p.id]?.unique_visitors ?? 0}人)
                  </span>
                </td>
                <td data-label="建立日期">{new Date(p.created_at).toLocaleDateString()}</td>
                <td data-label="操作" className="action-cell">
                  <button
                    type="button"
                    className="btn btn-sm btn-upload"
                    onClick={() => handleUploadClick(p.id)}
                    disabled={uploadingProductId === p.id}
                  >
                    {uploadingProductId === p.id ? '上傳中…' : '上傳圖片'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setEditProductId(p.id)
                      setModalOpen(true)
                    }}
                  >
                    編輯
                  </button>
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

      {/* 隱藏的檔案選擇器 — 給列上的上傳按鈕使用 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        disabled={uploadingProductId !== null}
      />

      {modalOpen && (
        <ProductFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditProductId(null)
          }}
          onSuccess={() => {
            loadData()
            setEditProductId(null)
          }}
          editProductId={editProductId}
        />
      )}
    </div>
  )
}

export default ProductsPage
