import React, { useEffect, useState, useRef } from 'react'
import {
  createProduct,
  updateProduct,
  updateProductImages,
  updateProductTags,
  uploadImage,
  fetchProductWithImages,
} from '../api/products'
import { fetchAllCategories } from '../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../types'
import LazyImage from './LazyImage'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** 預設分類 ID（從分類管理頁快速新增時帶入） */
  preselectedCategoryId?: number
  /** 編輯模式：傳入產品 ID 會載入既有資料 */
  editProductId?: number | null
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedCategoryId,
  editProductId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [error, setError] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; label: string }[]
  >([])

  const isEdit = !!editProductId

  // 當 modal 開啟時重設表單 & 載入分類選項
  useEffect(() => {
    if (!open) return

    setName('')
    setCategoryId(preselectedCategoryId ?? '')
    setDescription('')
    setIsPublished(true)
    setImageUrls([])
    setTags([])
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

    // 編輯模式：載入既有資料
    if (editProductId) {
      setLoadingEdit(true)
      fetchProductWithImages(editProductId)
        .then(({ product, images }) => {
          if (!product) {
            setError('找不到此產品')
            return
          }
          setName(product.name)
          setCategoryId(product.category_id)
          setDescription(product.description)
          setIsPublished(product.is_published)
          setImageUrls(images.map((img) => img.image_url))
          setTags(product.tags ?? [])
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingEdit(false))
    }
  }, [open, preselectedCategoryId, editProductId])

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
      if (isEdit && editProductId) {
        await updateProduct(editProductId, {
          name: name.trim(),
          category_id: Number(categoryId),
          description,
          is_published: isPublished,
        })
        await updateProductImages(editProductId, imageUrls)
        await updateProductTags(editProductId, tags)
      } else {
        await createProduct({
          name: name.trim(),
          category_id: Number(categoryId),
          description,
          is_published: isPublished,
          imageUrls,
          tags,
        })
      }
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
          <h2>{isEdit ? '編輯產品' : '新增產品'}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {loadingEdit ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            載入中...
          </div>
        ) : (
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
                    <LazyImage src={url} alt={`照片 ${idx + 1}`} />
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
            <label>產品標籤</label>
            <div className="tag-checkboxes">
              {['hot', 'sale'].map((tag) => (
                <label key={tag} className="checkbox-label tag-checkbox">
                  <input
                    type="checkbox"
                    checked={tags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTags((prev) => [...prev, tag])
                      } else {
                        setTags((prev) => prev.filter((t) => t !== tag))
                      }
                    }}
                  />
                  {tag === 'hot' ? '🔥 熱門' : '特價'}
                </label>
              ))}
            </div>
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
              {saving ? '儲存中...' : isEdit ? '儲存' : '新增產品'}
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
        )}
      </div>
    </div>
  )
}

export default ProductFormModal
