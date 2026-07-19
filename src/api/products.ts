import { supabase } from './supabase'
import type { Product, ProductImage } from '../types'

/** 上傳圖片 — 透過 Vercel Serverless Function 代理（Key 不進前端 bundle） */
export async function uploadImage(file: File): Promise<string> {
  // 將檔案轉為 base64，透過 JSON 傳給 Serverless Function
  const base64 = await fileToBase64(file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message ?? '圖片上傳失敗')
  }
  return data.data.url
}

/** 將 File 轉為 base64 data URL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

/** 取得某分類下的產品列表 */
export async function fetchProductsByCategory(
  categoryId: number,
  publishedOnly: boolean = true
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })

  if (publishedOnly) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((item: any) => ({
    ...item,
    images: item.product_images ?? [],
  }))
}

/** 取得單一產品（含圖片） */
export async function fetchProductWithImages(
  id: number
): Promise<{ product: Product | null; images: ProductImage[] }> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (productError) throw productError

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  if (imagesError) throw imagesError

  return { product, images: images ?? [] }
}

/** 建立產品 */
export async function createProduct(params: {
  name: string
  category_id: number
  description?: string
  is_published?: boolean
  imageUrls: string[]
  tags?: string[]
}): Promise<Product> {
  // 先取同分類最大 sort_order
  const { data: siblings } = await supabase
    .from('products')
    .select('sort_order')
    .eq('category_id', params.category_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = siblings?.[0]?.sort_order ?? -1

  // 建立產品
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: params.name,
      category_id: params.category_id,
      description: params.description ?? '',
      is_published: params.is_published ?? true,
      sort_order: maxOrder + 1,
      tags: params.tags ?? [],
    })
    .select()
    .single()

  if (productError) throw productError

  // 寫入圖片（如有）
  if (params.imageUrls.length > 0) {
    const imageRows = params.imageUrls.map((url, idx) => ({
      product_id: product.id,
      image_url: url,
      sort_order: idx,
    }))

    const { error: imageError } = await supabase
      .from('product_images')
      .insert(imageRows)

    if (imageError) throw imageError
  }

  return product
}

/** 更新產品 */
export async function updateProduct(
  id: number,
  params: {
    name?: string
    category_id?: number
    description?: string
    is_published?: boolean
    sort_order?: number
  }
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update(params)
    .eq('id', id)

  if (error) throw error
}

/** 更新產品圖片（全量取代） */
export async function updateProductImages(
  productId: number,
  imageUrls: string[]
): Promise<void> {
  // 刪除舊圖片
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)

  if (deleteError) throw deleteError

  // 寫入新圖片
  if (imageUrls.length > 0) {
    const imageRows = imageUrls.map((url, idx) => ({
      product_id: productId,
      image_url: url,
      sort_order: idx,
    }))

    const { error: insertError } = await supabase
      .from('product_images')
      .insert(imageRows)

    if (insertError) throw insertError
  }
}

/** 更新產品標籤 */
export async function updateProductTags(
  id: number,
  tags: string[]
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ tags })
    .eq('id', id)

  if (error) throw error
}

/** 取得所有已上架且被標記為 hot 的產品（限 8 筆） */
export async function fetchHotProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .contains('tags', ['hot'])
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(8)

  if (error) throw error
  return (data ?? []).map((item: any) => ({
    ...item,
    images: item.product_images ?? [],
  }))
}

/** 取得最新上架產品（預設 8 筆） */
export async function fetchLatestProducts(
  limit: number = 8
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((item: any) => ({
    ...item,
    images: item.product_images ?? [],
  }))
}

/** 記錄產品瀏覽事件 */
export async function trackProductView(
  productId: number,
  visitorId: string,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from('product_page_views')
    .insert({
      product_id: productId,
      visitor_id: visitorId,
      session_id: sessionId,
    })

  // 靜默失敗，不影響使用者體驗
  if (error) {
    console.warn('trackProductView error:', error.message)
  }
}

/** 取得多個產品的瀏覽統計（回傳 product_id → { views, unique_visitors }） */
export async function fetchProductsViewStats(
  productIds: number[]
): Promise<Record<number, { views: number; unique_visitors: number }>> {
  if (productIds.length === 0) return {}

  const { data, error } = await supabase
    .from('product_page_views')
    .select('product_id, visitor_id')
    .in('product_id', productIds)

  if (error) throw error

  const result: Record<number, { views: number; unique_visitors: number }> = {}
  for (const pid of productIds) {
    result[pid] = { views: 0, unique_visitors: 0 }
  }

  const visitorSet: Record<number, Set<string>> = {}
  for (const row of data ?? []) {
    if (!result[row.product_id]) {
      result[row.product_id] = { views: 0, unique_visitors: 0 }
    }
    result[row.product_id].views++
    if (!visitorSet[row.product_id]) visitorSet[row.product_id] = new Set()
    visitorSet[row.product_id].add(row.visitor_id)
  }

  for (const pid of Object.keys(visitorSet)) {
    result[Number(pid)].unique_visitors = visitorSet[Number(pid)].size
  }

  return result
}

/** 取得熱門產品 Top N（依瀏覽次數排序） */
export async function fetchTopViewedProducts(
  limit: number = 10
): Promise<{ product_id: number; views: number }[]> {
  const { data, error } = await supabase
    .from('product_page_views')
    .select('product_id, count')
    .limit(limit)
    .order('count', { ascending: false })

  if (error) {
    // 若 count 無法使用，改用原始資料計算
    const { data: raw, error: rawError } = await supabase
      .from('product_page_views')
      .select('product_id')

    if (rawError) throw rawError

    const countMap: Record<number, number> = {}
    for (const row of raw ?? []) {
      countMap[row.product_id] = (countMap[row.product_id] ?? 0) + 1
    }

    return Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([product_id, views]) => ({ product_id: Number(product_id), views }))
  }

  return (data ?? []).map((row: any) => ({
    product_id: row.product_id,
    views: row.count,
  }))
}

/** 取得近 N 日每日瀏覽趨勢 */
export async function fetchDailyViewTrend(
  days: number = 7
): Promise<{ date: string; views: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('product_page_views')
    .select('viewed_at')
    .gte('viewed_at', since.toISOString())

  if (error) throw error

  const dayMap: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }

  for (const row of data ?? []) {
    const key = new Date(row.viewed_at).toISOString().slice(0, 10)
    if (dayMap[key] !== undefined) {
      dayMap[key]++
    }
  }

  return Object.entries(dayMap).map(([date, views]) => ({ date, views }))
}

/** 刪除產品 */
export async function deleteProduct(id: number): Promise<void> {
  // 圖片會因 ON DELETE CASCADE 自動刪除
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/** 關鍵字搜尋產品 */
export async function searchProducts(
  keyword: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${keyword}%`)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(50)

  if (error) throw error
  return data ?? []
}

/** 批次取得多個分類下的產品（前台用，僅已上架）
 * 回傳以 category_id 為 key 的 Map
 * 支援分頁：傳入 options.limit / options.offset 時使用 Supabase range()
 * 保持向後相容（無傳 options 時回傳全部）
 */
export async function fetchProductsByCategoryIds(
  categoryIds: number[],
  options?: { limit?: number; offset?: number }
): Promise<Record<number, Product[]>> {
  if (categoryIds.length === 0) return {}

  let query = supabase
    .from('products')
    .select('*, product_images(*)')
    .in('category_id', categoryIds)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (options?.limit !== undefined) {
    const offset = options?.offset ?? 0
    query = query.range(offset, offset + options.limit - 1)
  }

  const { data, error } = await query
  if (error) throw error

  const products = (data ?? []).map((item: any) => ({
    ...item,
    images: item.product_images ?? [],
  }))

  const grouped: Record<number, Product[]> = {}
  for (const product of products) {
    if (!grouped[product.category_id]) {
      grouped[product.category_id] = []
    }
    grouped[product.category_id].push(product)
  }

  return grouped
}

/** 分頁取得指定分類下的產品（扁平陣列 + 總數）
 * 專為 SmallRow 無限滾動設計
 */
export async function fetchPaginatedCategoryProducts(
  categoryIds: number[],
  options: { limit: number; offset: number }
): Promise<{ items: Product[]; total: number }> {
  if (categoryIds.length === 0) return { items: [], total: 0 }

  const { data, error, count } = await supabase
    .from('products')
    .select('*, product_images(*)', { count: 'exact', head: false })
    .in('category_id', categoryIds)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .range(options.offset, options.offset + options.limit - 1)

  if (error) throw error

  return {
    items: (data ?? []).map((item: any) => ({
      ...item,
      images: item.product_images ?? [],
    })),
    total: count ?? 0,
  }
}

/** 取得所有產品（後台用，含主圖） */
export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((item: any) => ({
    ...item,
    images: item.product_images ?? [],
  }))
}
