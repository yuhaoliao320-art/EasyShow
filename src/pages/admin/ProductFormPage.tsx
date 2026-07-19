import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createProduct,
  updateProduct,
  uploadImage,
  fetchProductWithImages,
  updateProductImages,
} from '../../api/products'
import { fetchAllCategories } from '../../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../../types'
import LazyImage from '../../components/LazyImage'

const ProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!productId
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  // 從 URL query 帶入預設分類（分類管理頁快速新增商品）
  const initialCategoryId = searchParams.get('categoryId')
  const [categoryId, setCategoryId] = useState<number | ''>(
    initialCategoryId ? Number(initialCategoryId) : ''
  )
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; label: string }[]
  >([])

  useEffect(() => {
    fetchAllCategories().then((categories) => {
      const tree = buildCategoryTree(categories)
      setCategoryTree(tree)

      // 攤平成 select options
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
  }, [])

  // 編輯模式載入
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    fetchProductWithImages(Number(productId))
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [productId])

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
      if (isEdit && productId) {
        await updateProduct(Number(productId), {
          name: name.trim(),
          category_id: Number(categoryId),
          description,
          is_published: isPublished,
        })
        await updateProductImages(Number(productId), imageUrls)
      } else {
        await createProduct({
          name: name.trim(),
          category_id: Number(categoryId),
          description,
          is_published: isPublished,
          imageUrls,
        })
      }
      navigate('/admin/products')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">載入中...</div>
  if (error && !name) return <div className="error">{error}</div>

  return (
    <div className="product-form-page">
      <h1>{isEdit ? '編輯產品' : '新增產品'}</h1>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">
            產品名稱 <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            placeholder="請輸入產品名稱（限 50 字）"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">
            所屬分類 <span className="required">*</span>
          </label>
          <select
            id="category"
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
          <label htmlFor="description">簡短描述（選填）</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            placeholder="限 100 字"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>
            產品照片（可上傳多張，最多 10 張）
          </label>
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
            <span className="image-count">
              {imageUrls.length} / 10
            </span>
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

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/products')}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormPage
