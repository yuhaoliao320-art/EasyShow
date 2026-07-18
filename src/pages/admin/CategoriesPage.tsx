import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  fetchAllCategories,
  createCategory,
  updateCategoryName,
  moveCategory,
  deleteCategory,
  batchUpdateCategories,
} from '../../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../../types'
import ProductFormModal from '../../components/ProductFormModal'

const CategoriesPage: React.FC = () => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [flatList, setFlatList] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [addProductCategoryId, setAddProductCategoryId] = useState<number | undefined>()

  // 拖放狀態
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'child'>('after')
  const dragItemRef = useRef<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      const categories = await fetchAllCategories()
      const t = buildCategoryTree(categories)
      setTree(t)
      // 攤平為 list
      const flat: CategoryTreeNode[] = []
      const flatten = (nodes: CategoryTreeNode[]) => {
        for (const n of nodes) {
          flat.push(n)
          flatten(n.children)
        }
      }
      flatten(t)
      setFlatList(flat)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAdd = async (parentId: number | null) => {
    const name = prompt('請輸入分類名稱：')
    if (!name?.trim()) return
    try {
      await createCategory(name.trim(), parentId)
      loadData()
    } catch (err: any) {
      alert('新增失敗：' + err.message)
    }
  }

  const handleRename = async (id: number, currentName: string) => {
    const name = prompt('請輸入新名稱：', currentName)
    if (!name?.trim() || name.trim() === currentName) return
    try {
      await updateCategoryName(id, name.trim())
      loadData()
    } catch (err: any) {
      alert('修改失敗：' + err.message)
    }
  }

  const handleMove = async (id: number) => {
    const targetIdStr = prompt(
      '請輸入目標分類 ID（空白表示移到頂層）：'
    )
    const targetId = targetIdStr?.trim()
      ? Number(targetIdStr)
      : null
    if (targetId === id) {
      alert('不能移動到自己底下')
      return
    }
    try {
      await moveCategory(id, targetId)
      loadData()
    } catch (err: any) {
      alert('移動失敗：' + err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此分類？')) return
    try {
      const result = await deleteCategory(id)
      if (!result.ok) {
        alert(result.message)
        return
      }
      loadData()
    } catch (err: any) {
      alert('刪除失敗：' + err.message)
    }
  }

  // ----- 拖放排序 -----
  const handleDragStart = (node: CategoryTreeNode) => {
    dragItemRef.current = node.id
  }

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (targetId === dragItemRef.current) return

    setDragOverId(targetId)

    // 根據滑鼠在元素中的垂直位置決定 drop 位置
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const ratio = y / rect.height

    if (ratio < 0.25) {
      setDropPosition('before')
    } else if (ratio > 0.75) {
      setDropPosition('after')
    } else {
      setDropPosition('child')
    }
  }

  const handleDragLeave = (targetId: number) => {
    if (dragOverId === targetId) {
      setDragOverId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetNode: CategoryTreeNode) => {
    e.preventDefault()
    setDragOverId(null)

    const draggedId = dragItemRef.current
    if (draggedId === null || draggedId === targetNode.id) return

    try {
      // 從當前 tree 移除 dragged 節點，再根據 drop 位置重新插入
      const categories = await fetchAllCategories()

      // 找出 dragged 節點目前的 parent_id
      const draggedCat = categories.find((c) => c.id === draggedId)
      if (!draggedCat) return

      // 決定新的 parent_id
      let newParentId: number | null
      if (dropPosition === 'child') {
        newParentId = targetNode.id
      } else {
        // before/after → 與 targetNode 同層
        newParentId = targetNode.parent_id
      }

      // 防止移動到自己底下
      if (newParentId === draggedId) return
      // 防止移動到子孫底下
      const isDescendant = (parentId: number | null): boolean => {
        if (parentId === null) return false
        if (parentId === draggedId) return true
        const parent = categories.find((c) => c.id === parentId)
        return parent ? isDescendant(parent.parent_id) : false
      }
      if (isDescendant(newParentId)) return

      // 先更新被拖曳分類的 parent_id
      await moveCategory(draggedId, newParentId)

      // 重新取得所有分類（已更新 parent_id）
      const updatedCategories = await fetchAllCategories()
      const updatedTree = buildCategoryTree(updatedCategories)

      // 攤平，重新計算 sort_order
      const flat: CategoryTreeNode[] = []
      const flatten = (nodes: CategoryTreeNode[]) => {
        for (const n of nodes) {
          flat.push(n)
          flatten(n.children)
        }
      }
      flatten(updatedTree)

      // 找到 targetNode 在攤平後的 index
      const targetFlatIdx = flat.findIndex((n) => n.id === targetNode.id)
      const draggedFlatIdx = flat.findIndex((n) => n.id === draggedId)
      if (targetFlatIdx === -1 || draggedFlatIdx === -1) {
        loadData()
        return
      }

      // 從 flat 中移除 dragged 節點（含子孫）
      const draggedNode = flat[draggedFlatIdx]
      // 收集要移除的 ids（節點本身 + 所有子孫）
      const removeIds = new Set<number>()
      const collectDescendants = (node: CategoryTreeNode) => {
        removeIds.add(node.id)
        for (const child of node.children) {
          collectDescendants(child)
        }
      }
      collectDescendants(draggedNode)

      const flatWithoutDragged = flat.filter((n) => !removeIds.has(n.id))

      // 重新插入到目標位置
      // 找出目標 index（在移除後的陣列中）
      const adjustedTargetIdx = flatWithoutDragged.findIndex((n) => n.id === targetNode.id)
      if (adjustedTargetIdx === -1) {
        loadData()
        return
      }

      let insertIdx: number
      if (dropPosition === 'before') {
        insertIdx = adjustedTargetIdx
      } else if (dropPosition === 'after') {
        insertIdx = adjustedTargetIdx + 1
      } else {
        // child: 插入在 targetNode 的所有子節點之前
        // 找到 targetNode 的第一個子節點的位置
        const firstChildIdx = flatWithoutDragged.findIndex(
          (n) => n.parent_id === targetNode.id
        )
        insertIdx = firstChildIdx !== -1 ? firstChildIdx : adjustedTargetIdx + 1
      }

      flatWithoutDragged.splice(insertIdx, 0, draggedNode)

      // 重新計算 parent_id 與 sort_order
      const updates: { id: number; parent_id: number | null; sort_order: number }[] = []
      const assignOrder = (nodes: CategoryTreeNode[], parentId: number | null) => {
        nodes.forEach((node, idx) => {
          // 如果是 dragged 節點，使用新的 parentId
          const effectiveParentId = node.id === draggedId ? newParentId : node.parent_id
          updates.push({
            id: node.id,
            parent_id: effectiveParentId,
            sort_order: idx,
          })
          assignOrder(node.children, node.id)
        })
      }

      // 從攤平後的陣列重建樹狀結構
      const rebuildTree = (nodes: CategoryTreeNode[], parentId: number | null): CategoryTreeNode[] => {
        return nodes
          .filter((n) => {
            const effectivePid = n.id === draggedId ? newParentId : n.parent_id
            return effectivePid === parentId
          })
          .map((n) => ({
            ...n,
            parent_id: n.id === draggedId ? newParentId : n.parent_id,
            children: rebuildTree(nodes, n.id),
          }))
      }

      const newTree = rebuildTree(flatWithoutDragged, null)
      assignOrder(newTree, null)

      await batchUpdateCategories(updates)
      loadData()
    } catch (err: any) {
      alert('排序失敗：' + err.message)
      loadData()
    } finally {
      dragItemRef.current = null
    }
  }

  const handleDragEnd = () => {
    setDragOverId(null)
    dragItemRef.current = null
  }

  // 取得 drop indicator 的 CSS class
  const getDropClass = (nodeId: number) => {
    if (dragOverId !== nodeId) return ''
    return `drop-${dropPosition}`
  }

  if (loading) return <div className="loading">載入中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="admin-categories-page">
      <div className="page-header">
        <h1>分類管理</h1>
        <button className="btn btn-primary" onClick={() => handleAdd(null)}>
          + 新增頂層分類
        </button>
      </div>

      {flatList.length === 0 ? (
        <div className="empty-state">尚未建立任何分類</div>
      ) : (
        <div className="category-admin-list">
          {flatList.map((node) => (
            <div
              key={node.id}
              className={`category-admin-row ${getDropClass(node.id)} ${dragItemRef.current === node.id ? 'dragging' : ''}`}
              style={{ paddingLeft: `${node.depth * 24 + 12}px` }}
              draggable
              onDragStart={() => handleDragStart(node)}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDragLeave={() => handleDragLeave(node.id)}
              onDrop={(e) => handleDrop(e, node)}
              onDragEnd={handleDragEnd}
            >
              <span className="drag-handle">⠿</span>
              <span className="category-admin-name">{node.name}</span>
              <span className="category-admin-id">(ID: {node.id})</span>
              <div className="category-admin-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => handleAdd(node.id)}
                >
                  + 子分類
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleRename(node.id, node.name)}
                >
                  重新命名
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleMove(node.id)}
                >
                  移動
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setAddProductCategoryId(node.id)
                    setModalOpen(true)
                  }}
                >
                  + 新增商品
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(node.id)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <ProductFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadData}
          preselectedCategoryId={addProductCategoryId}
        />
      )}
    </div>
  )
}

export default CategoriesPage
