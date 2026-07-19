import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { fetchAllCategories } from '../api/categories'
import { fetchAllSettings } from '../api/settings'
import { buildCategoryTree, type CategoryTreeNode, settingsToMap } from '../types'
import CategoryTree from './CategoryTree'
import SearchBar from './SearchBar'

const Layout: React.FC = () => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [company, setCompany] = useState<Record<string, string>>({})
  const location = useLocation()

  // Extract current category ID from URL for highlighting in sidebar
  const match = location.pathname.match(/\/category\/(\d+)/)
  const activeId = match ? Number(match[1]) : undefined

  useEffect(() => {
    Promise.all([
      fetchAllCategories(),
      fetchAllSettings(),
    ])
      .then(([categories, settings]) => {
        setTree(buildCategoryTree(categories))
        setCompany(settingsToMap(settings))
      })
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
          {company.company_name || 'EasyShow'}
        </Link>
        <SearchBar />
        <nav className="front-nav">
          <Link
            to="/about"
            className={`front-nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            關於我們
          </Link>
          <Link
            to="/browse"
            className={`front-nav-link ${location.pathname === '/browse' ? 'active' : ''}`}
          >
            產品分類
          </Link>
          <a
            href="/admin"
            className="front-nav-link front-admin-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            管理後台
          </a>
        </nav>
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
          <Outlet context={{ tree, company, setSidebarOpen }} />
        </main>
      </div>

      {/* Footer */}
      <footer className="front-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              {company.company_name || 'EasyShow'}
            </Link>
          </div>
          <div className="footer-links">
            <span className="footer-links-title">瀏覽</span>
            <Link to="/" className="footer-link">首頁</Link>
            <Link to="/about" className="footer-link">關於我們</Link>
            <Link to="/browse" className="footer-link">產品分類</Link>
          </div>
          <div className="footer-contact">
            <span className="footer-links-title">聯絡</span>
            {company.company_phone && (
              <a href={`tel:${company.company_phone}`} className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {company.company_phone}
              </a>
            )}
            {company.company_email && (
              <a href={`mailto:${company.company_email}`} className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {company.company_email}
              </a>
            )}
            {company.company_address && (
              <span className="footer-contact-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {company.company_address}
              </span>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <small>&copy; {new Date().getFullYear()} {company.company_name || 'EasyShow'} 版權所有</small>
        </div>
      </footer>
    </div>
  )
}

export default Layout
