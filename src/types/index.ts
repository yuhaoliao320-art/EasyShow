// ============================================
// Types
// ============================================

export interface Category {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
  // 前端擴充（非 DB 欄位）
  children?: Category[]
  _path?: string // breadcrumb path
}

export interface Product {
  id: number
  name: string
  category_id: number
  description: string
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // 前端擴充
  images?: ProductImage[]
  category_name?: string
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  sort_order: number
  created_at: string
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  depth: number
}

/** 遞迴建立分類樹 */
export function buildCategoryTree(
  categories: Category[],
  parentId: number | null = null,
  depth: number = 0
): CategoryTreeNode[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      ...c,
      depth,
      children: buildCategoryTree(categories, c.id, depth + 1),
    }))
}
