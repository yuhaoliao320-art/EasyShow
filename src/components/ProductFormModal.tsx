import React, { useEffect, useState, useRef } from 'react'
import { createProduct, uploadImage } from '../api/products'
import { fetchAllCategories } from '../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../types'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** 預設分類 ID（從分類管理頁快速新增時帶入） */
  preselectedCategoryId?: number
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedCategoryId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; label: string }[]
  >([])

  // 當 modal 開啟時重設表單 & 載入分類選項
  useEffect(() => {
    if (!open) return

    setName('')
    setCategoryId(preselectedCategoryId ?? '')
    setDescription('')
    setIsPublished(true)
    setImageUrls([])
    setUploading(false)
    setSaving(false)
    setError('')

    fetchAllCategories().then((categories) => {
      const tree = buildCategoryTree(categories)
      const flat: { id: number; label: string }[] = []
      const flatten = (nodes: CategoryTreeNode[], prefix = '') => {
        for (const n of nodes) {
          flat.push({ id: n.id, label: prefix + n.name })
          flatten(n.children, prefix + '　')
        }
      }
      flatten(tree)
      setCategoryOptions(flat)
    })
  }, [open, preselectedCategoryId])

  // 點擊背景遮罩關閉
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // ESC 關閉
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i])
        setImageUrls((prev) => [...prev, url])
      }
    } catch (err: any) {
      alert('上傳失敗：' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReorderImage = (from: number, to: number) => {
    const newUrls = [...imageUrls]
    const [moved] = newUrls.splice(from, 1)
    newUrls.splice(to, 0, moved)
    setImageUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('請輸入產品名稱')
      return
    }
    if (!categoryId) {
      setError('請選擇所屬分類')
      return
    }

    setSaving(true)
    try {
      await createProduct({
        name: name.trim(),
        category_id: Number(categoryId),
        description,
        is_published: isPublished,
        imageUrls,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content product-form-modal">
        <div className="modal-header">
          <h2>新增產品</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="modal-name">
              產品名稱 <span className="required">*</span>
            </label>
            <input
              id="modal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              placeholder="請輸入產品名稱（限 50 字）"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-category">
              所屬分類 <span className="required">*</span>
            </label>
            <select
              id="modal-category"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value) || '')}
              required
            >
              <option value="">請選擇分類</option>
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modal-desc">簡短描述（選填）</label>
            <textarea
              id="modal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              placeholder="限 100 字"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>產品照片（可上傳多張，最多 10 張）</label>
            <div className="image-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading || imageUrls.length >= 10}
                className="file-input"
              />
              {uploading && <span className="uploading-text">上傳中...</span>}
              <span className="image-count">{imageUrls.length} / 10</span>
            </div>

            {imageUrls.length > 0 && (
              <div className="image-preview-grid">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img src={url} alt={`照片 ${idx + 1}`} />
                    <div className="image-preview-actions">
                      {idx > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleReorderImage(idx, idx - 1)}
                          title="左移"
                        >
                          ◀
                        </button>
                      )}
                      {idx < imageUrls.length - 1 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleReorderImage(idx, idx + 1)}
                          title="右移"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveImage(idx)}
                        title="刪除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              上架（勾選表示前台可見）
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '儲存中...' : '新增產品'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductFormModal
