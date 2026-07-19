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
  tags?: string[]
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

export interface Setting {
  key: string
  value: string
  description: string | null
  value_type: 'text' | 'number' | 'boolean' | 'email' | 'tel' | 'url' | 'textarea'
  created_at: string
  updated_at: string
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  depth: number
}

/** 將設定陣列轉為 key-value 物件 */
export function settingsToMap(settings: Setting[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const s of settings) {
    map[s.key] = s.value
  }
  return map
}

/** 在樹中找出指定 ID 的節點 */
export function findCategoryNode(
  tree: CategoryTreeNode[],
  id: number
): CategoryTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    const found = findCategoryNode(node.children, id)
    if (found) return found
  }
  return null
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
