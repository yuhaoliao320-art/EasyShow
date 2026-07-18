import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductWithImages } from '../api/products'
import { fetchAncestors } from '../api/categories'
import type { Product, ProductImage, Category } from '../types'
import Breadcrumb from '../components/Breadcrumb'

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const id = Number(productId)
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [ancestors, setAncestors] = useState<Category[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    setLoading(true)
    fetchProductWithImages(id)
      .then(async ({ product: p, images: imgs }) => {
        if (!p) {
          setError('找不到此產品')
          return
        }
        setProduct(p)
        setImages(imgs)

        // 取得分類祖先
        const ancs = await fetchAncestors(p.category_id)
        setAncestors(ancs)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="loading-skeleton" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="skeleton skeleton-text-sm" style={{ marginBottom: 16 }} />
        <div className="skeleton skeleton-text-lg" />
        <div className="skeleton skeleton-text" style={{ width: '90%' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div style={{ marginTop: 24 }}>
          <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 8 }} />
        </div>
      </div>
    )
  }
  if (error) return <div className="error">{error}</div>
  if (!product) return <div className="error">找不到此產品</div>

  return (
    <div className="product-detail-page">
      <Breadcrumb
        items={[
          { label: '首頁', href: '/' },
          ...ancestors.map((a) => ({
            label: a.name,
            href: `/category/${a.id}`,
          })),
          { label: product.name },
        ]}
      />

      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        ← 返回列表
      </button>

      <div className="product-detail">
        <h1 className="product-detail-name">{product.name}</h1>

        {product.description && (
          <p className="product-detail-desc">{product.description}</p>
        )}

        {images.length > 0 ? (
          <div className="product-gallery">
            <div
              className="product-main-image"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={images[currentImageIndex].image_url}
                alt={product.name}
              />
              <div className="image-zoom-hint">點擊放大</div>
            </div>

            {images.length > 1 && (
              <div className="product-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`thumbnail-btn ${
                      idx === currentImageIndex ? 'active' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img.image_url} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="no-image">暫無圖片</div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && images[currentImageIndex] && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <button
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
          <img
            src={images[currentImageIndex].image_url}
            alt={product.name}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="lightbox-nav">
              <button
                className="lightbox-nav-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(
                    (currentImageIndex - 1 + images.length) % images.length
                  )
                }}
              >
                ‹
              </button>
              <span className="lightbox-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button
                className="lightbox-nav-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(
                    (currentImageIndex + 1) % images.length
                  )
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
