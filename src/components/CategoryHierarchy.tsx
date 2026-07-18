import React, { useEffect, useRef, useState } from 'react'
import type { CategoryTreeNode, Product } from '../types'
import { Link } from 'react-router-dom'
import HorizontalProductCard from './HorizontalProductCard'

/* ============================================
   Data Structures
   ============================================ */

export interface SmallCategoryData {
  id: number
  name: string
  products: Product[]
}

export interface MidCategoryData {
  id: number
  name: string
  smalls: SmallCategoryData[]
}

export interface MajorCategoryData {
  id: number
  name: string
  mids: MidCategoryData[]
  totalCount: number
}

/* ============================================
   Helpers — build hierarchy from tree
   ============================================ */

/** Recursively collect all category IDs in a node's subtree (including the node itself) */
export function collectAllIds(node: CategoryTreeNode): number[] {
  const ids = [node.id]
  for (const child of node.children) {
    ids.push(...collectAllIds(child))
  }
  return ids
}

/**
 * Build the 3-level display hierarchy from a tree node.
 */
export function buildHierarchy(node: CategoryTreeNode): {
  majors: MajorCategoryData[]
  categoryIds: number[]
} {
  const allCategoryIds: number[] = []

  const majors: MajorCategoryData[] = (
    node.children.length > 0 ? node.children : [node]
  ).map((majorNode) => {
    const mids: MidCategoryData[] = []

    if (majorNode.children.length > 0) {
      for (const midNode of majorNode.children) {
        const smalls: SmallCategoryData[] = []

        if (midNode.children.length > 0) {
          for (const smallNode of midNode.children) {
            const allIds = collectAllIds(smallNode)
            allCategoryIds.push(...allIds)
            smalls.push({ id: smallNode.id, name: smallNode.name, products: [] })
          }
        } else {
          allCategoryIds.push(midNode.id)
          smalls.push({ id: midNode.id, name: '全部', products: [] })
        }

        mids.push({ id: midNode.id, name: midNode.name, smalls })
      }
    } else {
      allCategoryIds.push(majorNode.id)
      mids.push({
        id: majorNode.id,
        name: majorNode.name,
        smalls: [{ id: majorNode.id, name: '全部', products: [] }],
      })
    }

    return { id: majorNode.id, name: majorNode.name, mids, totalCount: 0 }
  })

  return { majors, categoryIds: allCategoryIds }
}

/**
 * Fill product data into the hierarchy.
 * For each small row, collect products from its entire subtree.
 */
export function fillProducts(
  majors: MajorCategoryData[],
  productsMap: Record<number, Product[]>,
  treeNode: CategoryTreeNode
): MajorCategoryData[] {
  const smallIdMap = new Map<number, number[]>()

  function buildSmallIdMap(node: CategoryTreeNode) {
    for (const child of node.children) {
      if (child.children.length > 0) {
        for (const smallNode of child.children) {
          smallIdMap.set(smallNode.id, collectAllIds(smallNode))
        }
      } else {
        smallIdMap.set(child.id, [child.id])
      }
    }
  }

  buildSmallIdMap(treeNode)

  for (const major of majors) {
    let total = 0
    for (const mid of major.mids) {
      for (const small of mid.smalls) {
        const allIds = smallIdMap.get(small.id) ?? [small.id]
        const allProducts: Product[] = []
        for (const cid of allIds) {
          const prods = productsMap[cid]
          if (prods) allProducts.push(...prods)
        }
        small.products = allProducts
        total += allProducts.length
      }
    }
    major.totalCount = total
  }
  return majors
}

/* ============================================
   Dot Progress Indicator
   ============================================ */

export const DotIndicator: React.FC<{ count: number; rowId: string }> = ({ count, rowId }) => {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = document.getElementById(rowId)
    if (!el || count <= 3) return

    const handleScroll = () => {
      const cardWidth = el.clientWidth * 0.65 + 10
      if (cardWidth <= 0) return
      const idx = Math.round(el.scrollLeft / cardWidth)
      setActive(Math.min(idx, count - 1))
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [count, rowId])

  if (count <= 3) return null

  const maxDots = 15
  const showDots = Math.min(count, maxDots)

  return (
    <div className="h-dots">
      {Array.from({ length: showDots }, (_, i) => (
        <span
          key={i}
          className={`h-dot ${i === Math.min(active, maxDots - 1) ? 'active' : ''}`}
        />
      ))}
      {count > maxDots && <span className="h-dot-more">+{count - maxDots}</span>}
    </div>
  )
}

/* ============================================
   Small Category Row
   ============================================ */

export const SmallRow: React.FC<{
  small: SmallCategoryData
  expanded: boolean
  onToggle: () => void
}> = ({ small, expanded, onToggle }) => {
  if (small.products.length === 0) return null

  const rowId = `scroll-${small.id}`
  const scrollRef = useRef<HTMLDivElement>(null)

  // 滑鼠滾輪 → 橫向捲動（原生 listener + passive:false 確保能 preventDefault）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [expanded])

  // 左右箭頭：捲動一個卡片寬度
  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('.h-product-card') as HTMLElement | null
    const gap = 10
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.6
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div className="h-small-section">
      <div className="h-small-header" onClick={onToggle}>
        <span className={`h-small-arrow ${expanded ? 'expanded' : ''}`}>▸</span>
        <span className="h-small-name">{small.name}</span>
        <span className="h-small-count">({small.products.length}項)</span>
      </div>
      {expanded && (
        <>
          <div className="h-scroll-wrapper">
            <button
              className="h-scroll-arrow h-scroll-arrow-left"
              onClick={() => scrollByCard(-1)}
              aria-label="向左捲動"
            >
              ‹
            </button>
            <div
              className="h-scroll-container"
              id={rowId}
              ref={scrollRef}
            >
              {small.products.map((product) => (
                <HorizontalProductCard key={product.id} product={product} />
              ))}
            </div>
            <button
              className="h-scroll-arrow h-scroll-arrow-right"
              onClick={() => scrollByCard(1)}
              aria-label="向右捲動"
            >
              ›
            </button>
          </div>
          <DotIndicator count={small.products.length} rowId={rowId} />
        </>
      )}
    </div>
  )
}

/* ============================================
   Mid Category Section (Sticky header + rows)
   ============================================ */

export const MidSection: React.FC<{
  mid: MidCategoryData
  expanded: boolean
  onToggle: () => void
  expandedSmalls: Set<number>
  onToggleSmall: (id: number) => void
}> = ({ mid, expanded, onToggle, expandedSmalls, onToggleSmall }) => {
  const visibleSmalls = mid.smalls.filter((s) => s.products.length > 0)
  if (visibleSmalls.length === 0) return null

  return (
    <div className="h-mid-section">
      <div className="h-mid-header" onClick={onToggle}>
        <span className={`h-mid-arrow ${expanded ? 'expanded' : ''}`}>▼</span>
        <span className="h-mid-name">{mid.name}</span>
      </div>
      {expanded && (
        <div className="h-mid-body">
          {visibleSmalls.map((small) => (
            <SmallRow
              key={small.id}
              small={small}
              expanded={expandedSmalls.has(small.id)}
              onToggle={() => onToggleSmall(small.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
