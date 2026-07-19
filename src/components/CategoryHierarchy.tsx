import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { CategoryTreeNode, Product } from '../types'
import HorizontalProductCard from './HorizontalProductCard'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { fetchPaginatedCategoryProducts } from '../api/products'

/* ============================================
   Data Structures
   ============================================ */

export interface SmallCategoryData {
  id: number
  name: string
  products: Product[]
  /** 此小分類的子樹所有分類 ID（含自身），用於分頁查詢產品 */
  categoryIds: number[]
}

export interface MidCategoryData {
  id: number
  name: string
  smalls: SmallCategoryData[]
  /** 葉中類（無子分類）：直接查詢產品的分類 ID */
  leafCategoryIds?: number[]
}

export interface MajorCategoryData {
  id: number
  name: string
  mids: MidCategoryData[]
  totalCount: number
  /** 葉大類（無子分類）：直接查詢產品的分類 ID */
  leafCategoryIds?: number[]
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
            smalls.push({
              id: smallNode.id,
              name: smallNode.name,
              products: [],
              categoryIds: allIds,
            })
          }
          mids.push({ id: midNode.id, name: midNode.name, smalls })
        } else {
          // 葉中類：不建立假的「全部」小分類
          allCategoryIds.push(midNode.id)
          mids.push({
            id: midNode.id,
            name: midNode.name,
            smalls: [],
            leafCategoryIds: [midNode.id],
          })
        }
      }
    } else {
      // 葉大類：不建立假的 mid/small 階層
      allCategoryIds.push(majorNode.id)
    }

    return {
      id: majorNode.id,
      name: majorNode.name,
      mids,
      totalCount: 0,
      leafCategoryIds: majorNode.children.length > 0 ? undefined : [majorNode.id],
    }
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
   Small Category Row — Infinite Scroll
   ============================================ */

export const SmallRow: React.FC<{
  small: SmallCategoryData
  expanded: boolean
  onToggle: () => void
  onCountChange?: (smallId: number, count: number) => void
  hideHeader?: boolean
}> = ({ small, expanded, onToggle, onCountChange, hideHeader = false }) => {
  const rowId = `scroll-${small.id}`
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 無限滾動：分批載入產品
  const [initialized, setInitialized] = useState(false)
  const [hidden, setHidden] = useState(false)

  const fetchProducts = useCallback(
    (params: { limit: number; offset: number; signal?: AbortSignal }) =>
      fetchPaginatedCategoryProducts(small.categoryIds, {
        limit: params.limit,
        offset: params.offset,
      }),
    [small.categoryIds]
  )

  const {
    items: loadedProducts,
    hasMore,
    loading,
    error,
    loadMore,
    retry,
    sentinelRef,
    containerRef,
  } = useInfiniteScroll<Product>(fetchProducts, { pageSize: 12 })

  // 首次展開時自動載入第一頁
  useEffect(() => {
    if ((expanded || hideHeader) && !initialized) {
      setInitialized(true)
      loadMore()
    }
  }, [expanded, initialized, loadMore, hideHeader])

  // 載入完成後若無產品則隱藏
  useEffect(() => {
    if (!loading && initialized && !hasMore && loadedProducts.length === 0) {
      setHidden(true)
    }
  }, [loading, initialized, hasMore, loadedProducts.length])

  // 有產品載入時，向上回報已載入數量
  useEffect(() => {
    if ((expanded || hideHeader) && initialized && onCountChange) {
      onCountChange(small.id, loadedProducts.length)
    }
  }, [loadedProducts.length, expanded, initialized, hideHeader, onCountChange, small.id])

  // 完全隱藏無產品的分類
  if (hidden) return null

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
      {!hideHeader && (
        <div className="h-small-header" onClick={onToggle}>
          <span className={`h-small-arrow ${expanded ? 'expanded' : ''}`}>▸</span>
          <span className="h-small-name">{small.name}</span>
          <span className="h-small-count">
            ({loadedProducts.length}{hasMore ? '+' : ''}項)
          </span>
        </div>
      )}
      {(hideHeader || expanded) && (
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
              ref={(node) => {
                scrollRef.current = node
                containerRef(node)
              }}
            >
              {loadedProducts.map((product) => (
                <HorizontalProductCard key={product.id} product={product} />
              ))}
              {/* sentinel 元素：偵測是否滾到底部 */}
              <div
                ref={sentinelRef}
                className="infinite-scroll-sentinel"
                style={{ flexShrink: 0, width: 1, alignSelf: 'stretch' }}
              />
            </div>
            <button
              className="h-scroll-arrow h-scroll-arrow-right"
              onClick={() => scrollByCard(1)}
              aria-label="向右捲動"
            >
              ›
            </button>
          </div>

          {/* 載入中 spinner */}
          {loading && loadedProducts.length > 0 && (
            <div className="infinite-scroll-spinner">
              <span className="infinite-scroll-spinner-icon" />
              載入中…
            </div>
          )}

          {/* 初始載入 spinner */}
          {loading && loadedProducts.length === 0 && (
            <div className="infinite-scroll-spinner">
              <span className="infinite-scroll-spinner-icon" />
              載入產品中…
            </div>
          )}

          {/* 全部載完 */}
          {!hasMore && !loading && loadedProducts.length > 0 && (
            <div className="infinite-scroll-end">
              已顯示全部 {loadedProducts.length} 項產品
            </div>
          )}

          {/* 載入錯誤 */}
          {error && (
            <div className="infinite-scroll-error">
              <span>載入失敗：{error}</span>
              <button className="infinite-scroll-retry" onClick={retry}>
                重試
              </button>
            </div>
          )}

          {/* 載入更多按鈕（fallback） */}
          {!loading && hasMore && loadedProducts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '8px 16px' }}>
              <button
                className="btn btn-sm"
                onClick={loadMore}
              >
                載入更多
              </button>
            </div>
          )}

          <DotIndicator count={loadedProducts.length} rowId={rowId} />
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
  majorId?: number
  onCountChange?: (majorId: number, totalCount: number) => void
}> = ({ mid, expanded, onToggle, expandedSmalls, onToggleSmall, majorId, onCountChange }) => {
  // 彙總此中類下所有小類的產品數量，向上回報
  const smallCountsRef = useRef<Record<number, number>>({})

  const handleSmallCountChange = useCallback((smallId: number, count: number) => {
    smallCountsRef.current[smallId] = count
    const total = Object.values(smallCountsRef.current).reduce((sum, c) => sum + c, 0)
    if (majorId !== undefined && onCountChange) {
      onCountChange(majorId, total)
    }
  }, [majorId, onCountChange])

  // 不再根據 products.length 過濾 — SmallRow 會自行管理載入狀態
  if (mid.smalls.length === 0 && !mid.leafCategoryIds) return null

  return (
    <div className="h-mid-section">
      <div className="h-mid-header" onClick={onToggle}>
        <span className={`h-mid-arrow ${expanded ? 'expanded' : ''}`}>▼</span>
        <span className="h-mid-name">{mid.name}</span>
      </div>
      {expanded && (
        <div className="h-mid-body">
          {mid.smalls.length > 0 ? (
            mid.smalls.map((small) => (
              <SmallRow
                key={small.id}
                small={small}
                expanded={expandedSmalls.has(small.id)}
                onToggle={() => onToggleSmall(small.id)}
                onCountChange={handleSmallCountChange}
              />
            ))
          ) : mid.leafCategoryIds ? (
            <SmallRow
              small={{
                id: mid.id,
                name: mid.name,
                products: [],
                categoryIds: mid.leafCategoryIds,
              }}
              expanded={true}
              onToggle={() => {}}
              onCountChange={handleSmallCountChange}
              hideHeader
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
