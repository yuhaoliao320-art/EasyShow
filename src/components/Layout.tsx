import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { fetchAllCategories } from '../api/categories'
import { buildCategoryTree, type CategoryTreeNode } from '../types'
import CategoryTree from './CategoryTree'

const Layout: React.FC = () => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Extract current category ID from URL for highlighting in sidebar
  const match = location.pathname.match(/\/category\/(\d+)/)
  const activeId = match ? Number(match[1]) : undefined

  useEffect(() => {
    fetchAllCategories()
      .then((categories) => setTree(buildCategoryTree(categories)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="front-layout">
      {/* Header */}
      <header className="front-header">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? '關閉選單' : '開啟選單'}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <Link to="/" className="front-logo">
          EasyShow
        </Link>
        <a
          href="/admin"
          className="front-admin-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          管理後台
        </a>
      </header>

      {/* Body: sidebar + content */}
      <div className="front-body">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`front-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="front-sidebar-header">
            <h3>產品分類</h3>
          </div>
          <nav className="front-sidebar-nav">
            {loading ? (
              <div className="sidebar-loading">
                <div className="skeleton" style={{ height: 16, width: '80%', margin: '12px 16px' }} />
                <div className="skeleton" style={{ height: 16, width: '60%', margin: '8px 16px' }} />
                <div className="skeleton" style={{ height: 16, width: '70%', margin: '8px 16px' }} />
                <div className="skeleton" style={{ height: 16, width: '50%', margin: '8px 16px' }} />
              </div>
            ) : tree.length === 0 ? (
              <div className="sidebar-empty">尚無分類</div>
            ) : (
              <CategoryTree tree={tree} activeId={activeId} />
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="front-content">
          <Outlet context={{ tree }} />
        </main>
      </div>

      {/* Footer */}
      <footer className="front-footer">
        <small>&copy; {new Date().getFullYear()} EasyShow 建材產品目錄</small>
      </footer>
    </div>
  )
}

export default Layout
