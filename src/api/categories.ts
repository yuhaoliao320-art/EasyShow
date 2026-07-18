import { supabase } from './supabase'
import type { Category } from '../types'

/** 取得所有分類 */
export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** 取得單一分類 */
export async function fetchCategory(id: number): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/** 建立分類 */
export async function createCategory(
  name: string,
  parentId: number | null
): Promise<Category> {
  // 先取同層最大 sort_order
  const { data: siblings } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = siblings?.[0]?.sort_order ?? -1

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, parent_id: parentId, sort_order: maxOrder + 1 })
    .select()
    .single()

  if (error) throw error
  return data
}

/** 更新分類名稱 */
export async function updateCategoryName(
  id: number,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)

  if (error) throw error
}

/** 移動分類（更改 parent_id） */
export async function moveCategory(
  id: number,
  newParentId: number | null
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ parent_id: newParentId })
    .eq('id', id)

  if (error) throw error
}

/** 調整排序 */
export async function reorderCategory(
  id: number,
  sortOrder: number
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ sort_order: sortOrder })
    .eq('id', id)

  if (error) throw error
}

/** 批次更新分類的 parent_id 與 sort_order（拖放排序用） */
export async function batchUpdateCategories(
  updates: { id: number; parent_id: number | null; sort_order: number }[]
): Promise<void> {
  // 因 id 為 GENERATED ALWAYS AS IDENTITY，無法用 upsert，改為個別 UPDATE
  const promises = updates.map((u) =>
    supabase
      .from('categories')
      .update({ parent_id: u.parent_id, sort_order: u.sort_order })
      .eq('id', u.id)
  )
  const results = await Promise.all(promises)
  for (const result of results) {
    if (result.error) throw result.error
  }
}

/** 刪除分類（檢查是否有子分類或產品） */
export async function deleteCategory(id: number): Promise<{ ok: boolean; message?: string }> {
  // 檢查子分類
  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', id)
    .limit(1)

  if (children && children.length > 0) {
    return { ok: false, message: '此分類下有子分類，無法刪除。請先搬移或刪除子分類。' }
  }

  // 檢查產品
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (products && products.length > 0) {
    return { ok: false, message: '此分類下有產品，無法刪除。請先搬移或刪除產品。' }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
  return { ok: true }
}

/** 取得所有祖先分類（用於麵包屑）
 *
 * @param categoryId - 當前分類的 ID
 * @param category - 若已取得當前分類資料，可傳入避免重複請求
 */
export async function fetchAncestors(
  categoryId: number,
  category?: Category | null
): Promise<Category[]> {
  const ancestors: Category[] = []
  let currentId: number | null = categoryId
  // 若外部已取得當前分類資料，直接使用，否則從第一層開始抓
  let currentCategory: Category | null = category ?? null

  // 逐層往上找（最多 10 層防止無限迴圈）
  for (let i = 0; i < 10; i++) {
    const cat: Category | null = currentCategory ?? (await fetchCategory(currentId!))
    if (!cat) break
    ancestors.unshift(cat)
    if (cat.parent_id === null) break
    currentId = cat.parent_id
    currentCategory = null // 下一輪需 fetch 上層
  }

  return ancestors
}
