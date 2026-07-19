import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import LazyImage from './LazyImage'
import ProductBadge from './ProductBadge'

interface HorizontalProductCardProps {
  product: Product
}

const HorizontalProductCard: React.FC<HorizontalProductCardProps> = ({ product }) => {
  const mainImage = product.images?.[0]?.image_url

  return (
    <Link to={`/product/${product.id}`} className="h-product-card">
      <div className="h-product-card-image">
        {mainImage ? (
          <LazyImage
            src={mainImage}
            alt={product.name}
          />
        ) : (
          <div className="h-product-card-placeholder">
            <span>📷</span>
            <span>暫無圖片</span>
          </div>
        )}
        <ProductBadge tags={product.tags} createdAt={product.created_at} />
      </div>
      <div className="h-product-card-name">{product.name}</div>
    </Link>
  )
}

export default HorizontalProductCard
