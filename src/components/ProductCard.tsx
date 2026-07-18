import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'

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
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-card-placeholder">
            <span>📷</span>
            <span>暫無圖片</span>
          </div>
        )}
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
