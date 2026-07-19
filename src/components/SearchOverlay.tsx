import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchProducts } from '../api/products'
import { fetchAllCategories } from '../api/categories'
import type { Product, Category } from '../types'
import ProductCard from './ProductCard'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [topCategories, setTopCategories] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // 打開 overlay 時：鎖定 body 滾動、載入熱門分類
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // 載入頂層分類
      fetchAllCategories()
        .then((categories) => {
          const tops = categories
            .filter((c) => c.parent_id === null)
            .sort((a, b) => a.sort_order - b.sort_order)
          setTopCategories(tops)
        })
        .catch(() => {})
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 自動聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 監聽 ESC 鍵
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 關鍵字 debounce 搜尋 (300ms)
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchProducts(keyword.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [keyword])

  // 關閉時重置狀態
  useEffect(() => {
    if (!isOpen) {
      // 延遲重置以避免動畫衝突
      const timer = setTimeout(() => {
        setKeyword('')
        setResults([])
        setTopCategories([])
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCategoryClick = (catId: number) => {
    onClose()
    navigate(`/category/${catId}`)
  }

  if (!isOpen) return null

  return (
    <div className="search-overlay" onClick={handleBackgroundClick}>
      <div className="search-overlay-content">
        {/* Header */}
        <div className="search-overlay-header">
          <div className="search-overlay-input-wrapper">
            <span className="search-overlay-input-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="search-overlay-input"
              placeholder="搜尋產品名稱..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button
                className="search-overlay-clear"
                onClick={() => setKeyword('')}
                aria-label="清除搜尋"
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="search-overlay-close-btn"
            onClick={onClose}
            aria-label="關閉搜尋"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="search-overlay-body">
          {keyword.trim() ? (
            /* 搜尋結果 */
            <div className="search-overlay-results">
              {loading && (
                <div className="search-overlay-status">搜尋中...</div>
              )}
              {!loading && results.length === 0 && (
                <div className="search-overlay-status search-overlay-empty">
                  <span className="search-overlay-empty-icon">😕</span>
                  <p>沒有找到符合「{keyword}」的產品</p>
                </div>
              )}
              {!loading && results.length > 0 && (
                <>
                  <p className="search-overlay-results-count">
                    找到 {results.length} 筆結果
                  </p>
                  <div className="product-grid search-overlay-product-grid">
                    {results.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 熱門分類 */
            <div className="search-overlay-categories">
              <h3 className="search-overlay-categories-title">熱門分類</h3>
              <p className="search-overlay-categories-subtitle">
                點擊分類快速瀏覽，或在上方輸入關鍵字搜尋
              </p>
              <div className="search-overlay-category-tags">
                {topCategories.length === 0 ? (
                  <span className="search-overlay-categories-loading">
                    載入中...
                  </span>
                ) : (
                  topCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className="search-overlay-category-tag"
                      onClick={() => handleCategoryClick(cat.id)}
                    >
                      {cat.name}
                      <span className="search-overlay-category-tag-arrow">
                        →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchOverlay
