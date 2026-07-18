import React from 'react'

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
              <a href={item.href}>{item.label}</a>
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
