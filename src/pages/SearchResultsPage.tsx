import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchProducts } from '../api/products'
import { supabase } from '../api/supabase'
import type { Product, ProductImage } from '../types'
import ProductCard from '../components/ProductCard'

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const trimmedKeyword = keyword.trim()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchResults = async () => {
    if (!trimmedKeyword) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      let data = await searchProducts(trimmedKeyword)

      // Batch fetch images and category names for the returned products
      if (data.length > 0) {
        const productIds = data.map((p) => p.id)
        const categoryIds = [...new Set(data.map((p) => p.category_id))]

        const [{ data: imagesData }, { data: categoriesData }] = await Promise.all([
          supabase
            .from('product_images')
            .select('*')
            .in('product_id', productIds)
            .order('sort_order', { ascending: true }),
          supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds),
        ])

        const imageMap: Record<number, ProductImage[]> = {}
        for (const img of imagesData ?? []) {
          if (!imageMap[img.product_id]) imageMap[img.product_id] = []
          imageMap[img.product_id].push(img)
        }

        const categoryNameMap: Record<number, string> = {}
        for (const cat of categoriesData ?? []) {
          categoryNameMap[cat.id] = cat.name
        }

        data = data.map((p) => ({
          ...p,
          images: imageMap[p.id] || [],
          category_name: categoryNameMap[p.category_id] || '',
        }))
      }

      setProducts(data)
    } catch (err: any) {
      setError(err.message || '網路異常，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [trimmedKeyword])

  // No keyword provided
  if (!trimmedKeyword) {
    return (
      <div className="search-results-page">
        <div className="empty-state">
          <p>請輸入關鍵字進行搜尋</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="search-results-page">
        <div className="loading-skeleton">
          <div className="skeleton skeleton-text-lg" />
          <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 20 }} />
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="search-results-page">
        <div className="error">
          <p>網路異常，請稍後再試</p>
          <button
            className="btn btn-primary"
            onClick={fetchResults}
            style={{ marginTop: 16 }}
          >
            重新嘗試
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results-page">
      <h1 className="search-results-title">搜尋結果</h1>

      {products.length > 0 ? (
        <>
          <p className="search-results-summary">
            搜尋「{keyword}」共找到 {products.length} 項產品
          </p>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={product.category_name}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="search-results-empty">
          <p className="search-results-empty-text">
            找不到符合「{keyword}」的產品
          </p>
          <ul className="search-suggestions">
            <li>檢查關鍵字是否有錯字</li>
            <li>嘗試使用更通用的詞彙</li>
          </ul>
          <Link
            to="/browse"
            className="btn btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            瀏覽全部分類
          </Link>
        </div>
      )}
    </div>
  )
}

export default SearchResultsPage
