import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import LazyImage from './LazyImage'
import ProductBadge from './ProductBadge'

interface ProductCardProps {
  product: Product
  categoryName?: string  // 可選：顯示分類名稱
}

const ProductCard: React.FC<ProductCardProps> = ({ product, categoryName }) => {
  const mainImage = product.images?.[0]?.image_url

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        {mainImage ? (
          <LazyImage
            src={mainImage}
            alt={product.name}
          />
        ) : (
          <div className="product-card-placeholder">
            <span>📷</span>
            <span>暫無圖片</span>
          </div>
        )}
        <ProductBadge tags={product.tags} createdAt={product.created_at} />
        {categoryName && (
          <span className="product-card-badge">{categoryName}</span>
        )}
      </div>
      <div className="product-card-info">
        <div className="product-card-name">{product.name}</div>
      </div>
    </Link>
  )
}

export default ProductCard
