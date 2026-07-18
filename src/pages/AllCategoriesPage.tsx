import React, { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fetchProductsByCategoryIds } from '../api/products'
import { type CategoryTreeNode } from '../types'
import {
  buildHierarchy,
  fillProducts,
  MidSection,
  type MajorCategoryData,
} from '../components/CategoryHierarchy'

const AllCategoriesPage: React.FC = () => {
  const { tree } = useOutletContext<{ tree: CategoryTreeNode[] }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
    if (tree.length === 0) return

    setLoading(true)
    setError('')

    let cancelled = false

    const load = async () => {
      try {
        // Collect all root categories as individual "majors"
        // Each root's hierarchy is built independently
        const allMajors: MajorCategoryData[] = []
        const allCategoryIds: number[] = []

        for (const rootNode of tree) {
          const { majors: m, categoryIds: ids } = buildHierarchy(rootNode)
          allMajors.push(...m)
          allCategoryIds.push(...ids)
        }

        if (cancelled) return

        // Fetch products for ALL leaf categories across all roots
        const productsMap = await fetchProductsByCategoryIds(allCategoryIds)
        if (cancelled) return

        // Fill products for each root's hierarchy separately
        const filledMajors: MajorCategoryData[] = []
        for (const rootNode of tree) {
          const { majors: m } = buildHierarchy(rootNode)
          const filled = fillProducts(m, productsMap, rootNode)
          filledMajors.push(...filled)
        }

        // Initialize expand/collapse state
        const midIds = new Set<number>()
        const smallIds = new Set<number>()
        for (const major of filledMajors) {
          for (const mid of major.mids) {
            midIds.add(mid.id)
            for (const small of mid.smalls) {
              if (small.products.length > 0) smallIds.add(small.id)
            }
          }
        }

        setMajors(filledMajors)
        setExpandedMids(midIds)
        setExpandedSmalls(smallIds)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tree])

  if (loading || tree.length === 0) {
    return (
      <div className="loading-skeleton">
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
  if (visibleMajors.length === 0) return <div className="error">尚無產品</div>

  return (
    <div className="category-browse-page">
      {visibleMajors.map((major, majorIdx) => (
        <div key={major.id} className="h-major-section">
          <div className="h-major-banner">
            <span className="h-major-name">【 {major.name} 】</span>
            <span className="h-major-count">共 {major.totalCount} 款</span>
          </div>

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

          {majorIdx < visibleMajors.length - 1 && <div className="h-major-divider" />}
        </div>
      ))}
    </div>
  )
}

export default AllCategoriesPage
