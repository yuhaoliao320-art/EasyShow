import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
          <div className="product-card-placeholder">暫無圖片</div>
        )}
      </div>
      <div className="product-card-name">{product.name}</div>
    </Link>
  )
}

export default ProductCard
