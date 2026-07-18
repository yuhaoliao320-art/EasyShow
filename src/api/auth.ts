import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/** 登入 */
export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error('登入失敗')

  return data.user
}

/** 註冊（僅首次建立用） */
export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
}

/** 登出 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** 取得當前使用者 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

/** 監聽 auth 狀態變化 */
export function onAuthChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
