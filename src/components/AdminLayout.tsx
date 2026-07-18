import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut, onAuthChange } from '../api/auth'
import type { User } from '@supabase/supabase-js'

const AdminLayout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u)
        if (!u) navigate('/admin/login', { replace: true })
      })
      .finally(() => setLoading(false))

    const sub = onAuthChange((u) => {
      setUser(u)
      if (!u) navigate('/admin/login', { replace: true })
    })

    return () => sub.data.subscription.unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  if (loading) {
    return <div className="loading">載入中...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>管理後台</h2>
          <div className="admin-user">{user.email}</div>
        </div>
        <nav className="admin-nav">
          <a href="/admin" className="admin-nav-item">
            儀表板
          </a>
          <a href="/admin/categories" className="admin-nav-item">
            分類管理
          </a>
          <a href="/admin/products" className="admin-nav-item">
            產品管理
          </a>
          <a href="/admin/settings" className="admin-nav-item">
            網站設定
          </a>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-secondary" onClick={handleLogout}>
            登出
          </button>
          <a href="/" className="admin-back-link" target="_blank">
            查看前台 →
          </a>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
