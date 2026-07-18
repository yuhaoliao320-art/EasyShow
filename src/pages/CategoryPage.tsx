import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { fetchAncestors } from '../api/categories'
import { fetchProductsByCategoryIds } from '../api/products'
import { findCategoryNode, type CategoryTreeNode, type Category, type Product } from '../types'
import Breadcrumb from '../components/Breadcrumb'
import HorizontalProductCard from '../components/HorizontalProductCard'

/* ============================================
   Data Structures
   ============================================ */

interface SmallCategoryData {
  id: number
  name: string
  products: Product[]
}

interface MidCategoryData {
  id: number
  name: string
  smalls: SmallCategoryData[]
}

interface MajorCategoryData {
  id: number
  name: string
  mids: MidCategoryData[]
  totalCount: number
}

/* ============================================
   Helpers — build hierarchy from tree
   ============================================ */

/** Recursively collect all category IDs in a node's subtree (including the node itself) */
function collectAllIds(node: CategoryTreeNode): number[] {
  const ids = [node.id]
  for (const child of node.children) {
    ids.push(...collectAllIds(child))
  }
  return ids
}

/**
 * Build the 3-level display hierarchy from a tree node.
 *
 *   node depth 0 (or anchor) → top-level anchors whose children become "major" banners
 *   major's children         → "mid" sticky headers
 *   mid's children           → "small" horizontal rows (products collected recursively)
 *
 * For each small row we collect ALL category IDs in its subtree so that
 * products assigned to any descendant category (or the small itself) appear in that row.
 *
 * If a mid has no children, its own products appear as a single "全部" row.
 * If a major has no children, its own products appear under a "全部" mid+row.
 */
function buildHierarchy(node: CategoryTreeNode): {
  majors: MajorCategoryData[]
  categoryIds: number[]
} {
  const allLeafIds: number[] = []

  const majors: MajorCategoryData[] = (
    node.children.length > 0 ? node.children : [node]
  ).map((majorNode) => {
    const mids: MidCategoryData[] = []

    if (majorNode.children.length > 0) {
      for (const midNode of majorNode.children) {
        const smalls: SmallCategoryData[] = []

        if (midNode.children.length > 0) {
          for (const smallNode of midNode.children) {
            // Collect ALL category IDs in this small category's subtree
            const allIds = collectAllIds(smallNode)
            allLeafIds.push(...allIds)
            smalls.push({ id: smallNode.id, name: smallNode.name, products: [] })
          }
        } else {
          // Mid has no children → its own products become "全部" row
          allLeafIds.push(midNode.id)
          smalls.push({ id: midNode.id, name: '全部', products: [] })
        }

        mids.push({ id: midNode.id, name: midNode.name, smalls })
      }
    } else {
      // Major has no children → its own products become "全部" row
      allLeafIds.push(majorNode.id)
      mids.push({
        id: majorNode.id,
        name: majorNode.name,
        smalls: [{ id: majorNode.id, name: '全部', products: [] }],
      })
    }

    return { id: majorNode.id, name: majorNode.name, mids, totalCount: 0 }
  })

  return { majors, categoryIds: allLeafIds }
}

/**
 * Fill product data into the hierarchy.
 * For each small row, collect products from its own subtree leaf IDs.
 */
function fillProducts(
  majors: MajorCategoryData[],
  productsMap: Record<number, Product[]>,
  treeNode: CategoryTreeNode
): MajorCategoryData[] {
  // Build a map: smallCategoryId → list of all descendant category IDs
  const smallIdMap = new Map<number, number[]>()

  function buildSmallIdMap(node: CategoryTreeNode) {
    for (const child of node.children) {
      if (child.children.length > 0) {
        // This is a mid with children (smalls)
        for (const smallNode of child.children) {
          smallIdMap.set(smallNode.id, collectAllIds(smallNode))
        }
      } else {
        // This is a mid without children — treated as "全部" row
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

const DotIndicator: React.FC<{ count: number; rowId: string }> = ({ count, rowId }) => {
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

  // Cap visible dots at 15
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

const SmallRow: React.FC<{
  small: SmallCategoryData
  expanded: boolean
  onToggle: () => void
}> = ({ small, expanded, onToggle }) => {
  if (small.products.length === 0) return null

  const rowId = `scroll-${small.id}`

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
            <div className="h-scroll-container" id={rowId}>
              {small.products.map((product) => (
                <HorizontalProductCard key={product.id} product={product} />
              ))}
            </div>
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

const MidSection: React.FC<{
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

/* ============================================
   CategoryPage (Main)
   ============================================ */

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const id = Number(categoryId)
  const { tree } = useOutletContext<{ tree: CategoryTreeNode[] }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ancestors, setAncestors] = useState<Category[]>([])
  const [majors, setMajors] = useState<MajorCategoryData[]>([])
  const [expandedMids, setExpandedMids] = useState<Set<number>>(new Set())
  const [expandedSmalls, setExpandedSmalls] = useState<Set<number>>(new Set())

  const toggleMid = useCallback((midId: number) => {
    setExpandedMids((prev) => {
      const next = new Set(prev)
      if (next.has(midId)) next.delete(midId)
      else next.add(midId)
      return next
    })
  }, [])

  const toggleSmall = useCallback((smallId: number) => {
    setExpandedSmalls((prev) => {
      const next = new Set(prev)
      if (next.has(smallId)) next.delete(smallId)
      else next.add(smallId)
      return next
    })
  }, [])

  useEffect(() => {
    if (!id || tree.length === 0) return

    setLoading(true)
    setError('')

    const node = findCategoryNode(tree, id)
    if (!node) {
      setError('找不到此分類')
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        // Fetch ancestors for breadcrumb
        const ancs = await fetchAncestors(id)
        if (cancelled) return
        setAncestors(ancs)

        // Determine root node (depth 0) for building hierarchy
        let rootNode: CategoryTreeNode
        if (node.depth === 0) {
          rootNode = node
        } else if (ancs.length > 0) {
          rootNode = findCategoryNode(tree, ancs[0].id) ?? node
        } else {
          rootNode = node
        }

        const { majors: m, categoryIds: ids } = buildHierarchy(rootNode)
        if (cancelled) return

        // Fetch products for all leaf category IDs
        const productsMap = await fetchProductsByCategoryIds(ids)
        if (cancelled) return

        const filled = fillProducts(m, productsMap, rootNode)

        // Initialize expand/collapse state (all expanded by default)
        const midIds = new Set<number>()
        const smallIds = new Set<number>()
        for (const major of filled) {
          for (const mid of major.mids) {
            midIds.add(mid.id)
            for (const small of mid.smalls) {
              if (small.products.length > 0) smallIds.add(small.id)
            }
          }
        }

        setMajors(filled)
        setExpandedMids(midIds)
        setExpandedSmalls(smallIds)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, tree])

  /* ---- Loading skeleton ---- */
  if (loading || tree.length === 0) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton skeleton-text-sm" style={{ marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, marginBottom: 16, borderRadius: 0 }} />
        <div className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 0 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 12, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 0 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 10 }} />
      </div>
    )
  }

  if (error) return <div className="error">{error}</div>

  const visibleMajors = majors.filter((m) => m.totalCount > 0)
  if (visibleMajors.length === 0) return <div className="error">此分類尚無產品</div>

  return (
    <div className="category-browse-page">
      <Breadcrumb
        items={[
          { label: '首頁', href: '/' },
          ...ancestors.map((a) => ({
            label: a.name,
            href: a.id === id ? undefined : `/category/${a.id}`,
          })),
        ]}
      />

      {visibleMajors.map((major, majorIdx) => (
        <div key={major.id} className="h-major-section">
          {/* Major Category Banner */}
          <div className="h-major-banner">
            <span className="h-major-name">【 {major.name} 】</span>
            <span className="h-major-count">共 {major.totalCount} 款</span>
          </div>

          {/* Mid Categories */}
          {major.mids.map((mid) => (
            <MidSection
              key={mid.id}
              mid={mid}
              expanded={expandedMids.has(mid.id)}
              onToggle={() => toggleMid(mid.id)}
              expandedSmalls={expandedSmalls}
              onToggleSmall={toggleSmall}
            />
          ))}

          {/* Divider between majors */}
          {majorIdx < visibleMajors.length - 1 && <div className="h-major-divider" />}
        </div>
      ))}
    </div>
  )
}

export default CategoryPage
