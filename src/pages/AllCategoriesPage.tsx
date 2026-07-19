import React, { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { type CategoryTreeNode } from '../types'
import {
  buildHierarchy,
  MidSection,
  SmallRow,
  type MajorCategoryData,
} from '../components/CategoryHierarchy'

const AllCategoriesPage: React.FC = () => {
  const { tree } = useOutletContext<{ tree: CategoryTreeNode[] }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [majors, setMajors] = useState<MajorCategoryData[]>([])
  const [expandedMids, setExpandedMids] = useState<Set<number>>(new Set())
  const [expandedSmalls, setExpandedSmalls] = useState<Set<number>>(new Set())
  const [majorCounts, setMajorCounts] = useState<Record<number, number>>({})

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

  const handleMajorCountChange = useCallback((majorId: number, count: number) => {
    setMajorCounts((prev) => ({ ...prev, [majorId]: count }))
  }, [])

  useEffect(() => {
    if (tree.length === 0) return

    setLoading(true)
    setError('')

    let cancelled = false

    const load = async () => {
      try {
        // Collect all root categories as individual "majors"
        const allMajors: MajorCategoryData[] = []

        for (const rootNode of tree) {
          const { majors: m } = buildHierarchy(rootNode)
          allMajors.push(...m)
        }

        if (cancelled) return

        // 不再一次載入所有產品 — SmallRow 會自行分頁載入
        // 展開所有 mid 與 small（讓使用者可以看到完整分類結構）
        const midIds = new Set<number>()
        const smallIds = new Set<number>()
        for (const major of allMajors) {
          for (const mid of major.mids) {
            midIds.add(mid.id)
            for (const small of mid.smalls) {
              smallIds.add(small.id)
            }
          }
        }

        setMajors(allMajors)
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

  const visibleMajors = majors.filter((m) => m.mids.length > 0 || m.leafCategoryIds)
  if (visibleMajors.length === 0) return <div className="error">尚無產品</div>

  return (
    <div className="category-browse-page">
      {visibleMajors.map((major, majorIdx) => (
        <div key={major.id} className="h-major-section">
          <div className="h-major-banner">
            <span className="h-major-name">【 {major.name} 】</span>
            <span className="h-major-count">
            {majorCounts[major.id] !== undefined
              ? `共 ${majorCounts[major.id]} 項`
              : '載入中…'}
          </span>
          </div>

          {major.mids.length > 0 ? (
            major.mids.map((mid) => (
              <MidSection
                key={mid.id}
                mid={mid}
                expanded={expandedMids.has(mid.id)}
                onToggle={() => toggleMid(mid.id)}
                expandedSmalls={expandedSmalls}
                onToggleSmall={toggleSmall}
                majorId={major.id}
                onCountChange={handleMajorCountChange}
              />
            ))
          ) : major.leafCategoryIds ? (
            <SmallRow
              small={{
                id: major.id,
                name: major.name,
                products: [],
                categoryIds: major.leafCategoryIds,
              }}
              expanded={true}
              onToggle={() => {}}
              onCountChange={(_smallId, count) => handleMajorCountChange(major.id, count)}
              hideHeader
            />
          ) : null}

          {majorIdx < visibleMajors.length - 1 && <div className="h-major-divider" />}
        </div>
      ))}
    </div>
  )
}

export default AllCategoriesPage
