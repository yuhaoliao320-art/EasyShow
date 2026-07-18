import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAllCategories,
  createCategory,
  updateCategoryName,
  moveCategory,
  deleteCategory,
} from '../../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../../types'

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [flatList, setFlatList] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
              className="category-admin-row"
              style={{ paddingLeft: `${node.depth * 24 + 12}px` }}
            >
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
                  onClick={() => navigate(`/admin/products/new?categoryId=${node.id}`)}
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
    </div>
  )
}

export default CategoriesPage
