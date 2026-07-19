import React, { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { fetchAllCategories } from '../api/categories'
import { fetchHotProducts } from '../api/products'
import type { Category, Product } from '../types'
import ProductCard from '../components/ProductCard'
import SearchOverlay from '../components/SearchOverlay'

const HomePage: React.FC = () => {
  const { setSidebarOpen } = useOutletContext<{ setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }>()
  const [topCategories, setTopCategories] = useState<Category[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [isSearchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchAllCategories(),
      fetchHotProducts(),
    ])
      .then(([categories, hot]) => {
        // 只取最頂層分類（parent_id === null），依 sort_order 排序
        const tops = categories
          .filter((c) => c.parent_id === null)
          .sort((a, b) => a.sort_order - b.sort_order)
        setTopCategories(tops)
        setHotProducts(hot)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <h1 className="home-hero-title">精選建材 · 質感空間</h1>
          <p className="home-hero-subtitle">
            為您的空間找到最適合的建材材料，從瓷磚、木地板到五金配件，一站瀏覽
          </p>
          <Link to="/browse" className="home-hero-cta">
            瀏覽所有產品
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div
          className="home-feature-item"
          onClick={() => setSidebarOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          <span className="home-feature-icon">🏗️</span>
          <h3>多元建材</h3>
          <p>瓷磚、木地板、五金、燈具等數百種產品</p>
        </div>
        <div
          className="home-feature-item"
          style={{ cursor: 'pointer' }}
          onClick={() => setToastMessage('📸 實拍圖片功能開發中，敬請期待！')}
        >
          <span className="home-feature-icon">📸</span>
          <h3>實拍圖片</h3>
          <p>每個產品提供高清實拍圖，細節一目瞭然</p>
        </div>
        <div
          className="home-feature-item"
          onClick={() => setSearchOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSearchOpen(true); } }}
        >
          <span className="home-feature-icon">🔍</span>
          <h3>簡單搜尋</h3>
          <p>透過分類瀏覽快速找到您需要的材料</p>
        </div>
      </section>

      {/* Hot Products */}
      {hotProducts.length > 0 && (
        <section className="home-hot-products">
          <h2 className="home-section-title">🔥 熱門產品</h2>
          <p className="home-section-subtitle">最受歡迎的建材產品</p>
          <div className="product-grid">
            {hotProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Links to major categories */}
      <section className="home-categories">
        <h2 className="home-section-title">熱門分類</h2>
        <p className="home-section-subtitle">從左側選單選擇分類，或點擊下方快速前往</p>
        <div className="home-category-links">
          {loading ? (
            <span className="home-categories-loading">載入中...</span>
          ) : topCategories.length === 0 ? (
            <span className="home-categories-empty">暫無分類</span>
          ) : (
            topCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="home-category-link"
              >
                <span className="home-category-link-name">{cat.name}</span>
                <span className="home-category-link-arrow">→</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Toast */}
      {toastMessage && (
        <div className="toast toast-show">{toastMessage}</div>
      )}

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export default HomePage
