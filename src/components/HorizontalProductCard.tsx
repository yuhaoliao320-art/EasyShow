import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'

interface HorizontalProductCardProps {
  product: Product
}

const HorizontalProductCard: React.FC<HorizontalProductCardProps> = ({ product }) => {
  const mainImage = product.images?.[0]?.image_url

  return (
    <Link to={`/product/${product.id}`} className="h-product-card">
      <div className="h-product-card-image">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="h-product-card-placeholder">
            <span>📷</span>
            <span>暫無圖片</span>
          </div>
        )}
      </div>
      <div className="h-product-card-name">{product.name}</div>
    </Link>
  )
}

export default HorizontalProductCard
