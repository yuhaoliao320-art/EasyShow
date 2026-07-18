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
 */
export async function fetchProductsByCategoryIds(
  categoryIds: number[]
): Promise<Record<number, Product[]>> {
  if (categoryIds.length === 0) return {}

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .in('category_id', categoryIds)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

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
