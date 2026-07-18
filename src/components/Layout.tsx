import React from 'react'
import { Outlet, Link } from 'react-router-dom'

const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="app-logo">
          EasyShow
        </Link>
        <a href="/admin" className="admin-link">
          管理後台
        </a>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <small>&copy; {new Date().getFullYear()} EasyShow 建材產品目錄</small>
      </footer>
    </div>
  )
}

export default Layout
