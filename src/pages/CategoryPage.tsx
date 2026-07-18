import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchAllCategories, fetchAncestors } from '../api/categories'
import { fetchProductsByCategory } from '../api/products'
import { buildCategoryTree, type CategoryTreeNode, type Category, type Product } from '../types'
import Breadcrumb from '../components/Breadcrumb'
import CategoryTree from '../components/CategoryTree'
import ProductCard from '../components/ProductCard'

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const id = Number(categoryId)

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [ancestors, setAncestors] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError('')

    Promise.all([
      fetchAllCategories(),
      fetchProductsByCategory(id),
      fetchAncestors(id),
    ])
      .then(([categories, prods, ancs]) => {
        const current = categories.find((c) => c.id === id)
        if (!current) {
          setError('找不到此分類')
          return
        }
        setCategory(current)
        setTree(buildCategoryTree(categories))
        setProducts(prods)
        setAncestors(ancs)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">載入中...</div>
  if (error) return <div className="error">{error}</div>
  if (!category) return <div className="error">找不到此分類</div>

  // 同層其他分類（推薦用）
  const siblings = tree
    .flatMap((n) => [n, ...n.children.flat()])
    .filter((n) => n.parent_id === category.parent_id && n.id !== category.id)

  return (
    <div className="category-page">
      <Breadcrumb
        items={[
          { label: '首頁', href: '/' },
          ...ancestors.map((a) => ({
            label: a.name,
            href: a.id === id ? undefined : `/category/${a.id}`,
          })),
        ]}
      />

      <h1 className="category-title">{category.name}</h1>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>此分類目前尚無產品，請參考其他分類</p>
          {siblings.length > 0 && (
            <div className="sibling-suggestions">
              <p>您可以看看：</p>
              <div className="sibling-links">
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    to={`/category/${s.id}`}
                    className="sibling-link"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryPage
