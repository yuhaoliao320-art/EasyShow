import React from 'react'

export interface ProductBadgeProps {
  tags?: string[]
  createdAt?: string
}

const TAG_LABELS: Record<string, { label: string; className: string }> = {
  hot: { label: '🔥 熱門', className: 'badge-hot' },
  new: { label: '🆕 新品', className: 'badge-new' },
  sale: { label: '特價', className: 'badge-sale' },
}

const NEW_PRODUCT_DAYS = 30

export function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const diffDays = (now - created) / (1000 * 60 * 60 * 24)
  return diffDays <= NEW_PRODUCT_DAYS
}

const ProductBadge: React.FC<ProductBadgeProps> = ({ tags, createdAt }) => {
  const badges: { label: string; className: string }[] = []

  // 新品（自動計算）
  if (isNewProduct(createdAt)) {
    badges.push(TAG_LABELS.new)
  }

  // 手動標籤
  if (tags) {
    for (const tag of tags) {
      const config = TAG_LABELS[tag]
      if (config) {
        badges.push(config)
      }
    }
  }

  if (badges.length === 0) return null

  return (
    <div className="product-badges">
      {badges.map((badge, idx) => (
        <span key={idx} className={`product-badge ${badge.className}`}>
          {badge.label}
        </span>
      ))}
    </div>
  )
}

export default ProductBadge
