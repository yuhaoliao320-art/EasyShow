import { supabase } from './supabase'
import type { Setting } from '../types'

/** 取得所有設定 */
export async function fetchAllSettings(): Promise<Setting[]> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** 取得單一設定值 */
export async function fetchSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) throw error
  return data?.value ?? null
}

/** 更新設定值（若不存在則新增） */
export async function upsertSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) throw error
}

/** 批次更新多個設定 */
export async function upsertSettings(
  entries: { key: string; value: string }[]
): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert(entries, { onConflict: 'key' })

  if (error) throw error
}

/** 刪除設定 */
export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('key', key)

  if (error) throw error
}
