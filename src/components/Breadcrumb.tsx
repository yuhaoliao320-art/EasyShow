import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="breadcrumb" aria-label="麵包屑導航">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={idx} className="breadcrumb-item">
            {item.href && !isLast ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span className={isLast ? 'breadcrumb-current' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="breadcrumb-sep">›</span>}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
