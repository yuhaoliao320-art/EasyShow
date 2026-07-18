import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <h1 className="home-hero-title">精選建材 · 質感空間</h1>
          <p className="home-hero-subtitle">
            為您的空間找到最適合的建材材料，從瓷磚、木地板到五金配件，一站瀏覽
          </p>
          <Link to="/browse" className="home-hero-cta">
            瀏覽所有產品
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-feature-item">
          <span className="home-feature-icon">🏗️</span>
          <h3>多元建材</h3>
          <p>瓷磚、木地板、五金、燈具等數百種產品</p>
        </div>
        <div className="home-feature-item">
          <span className="home-feature-icon">📸</span>
          <h3>實拍圖片</h3>
          <p>每個產品提供高清實拍圖，細節一目瞭然</p>
        </div>
        <div className="home-feature-item">
          <span className="home-feature-icon">🔍</span>
          <h3>簡單搜尋</h3>
          <p>透過分類瀏覽快速找到您需要的材料</p>
        </div>
      </section>

      {/* Quick Links to major categories */}
      <section className="home-categories">
        <h2 className="home-section-title">熱門分類</h2>
        <p className="home-section-subtitle">從左側選單選擇分類，或點擊下方快速前往</p>
        <div className="home-category-links">
          {['瓷磚', '木地板', '五金配件', '燈具照明'].map((name, i) => (
            <Link
              key={i}
              to={`/category/${i + 1}`}
              className="home-category-link"
            >
              <span className="home-category-link-name">{name}</span>
              <span className="home-category-link-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
