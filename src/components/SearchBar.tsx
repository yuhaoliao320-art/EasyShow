import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      alert('請輸入關鍵字')
      return
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <div className={className ? `search-bar ${className}` : 'search-bar'}>
      <input
        type="text"
        className="search-bar-input"
        placeholder="搜尋產品名稱…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {query.length > 0 && (
        <button
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="清除搜尋"
          type="button"
        >
          ✕
        </button>
      )}
      <button
        className="search-bar-btn"
        onClick={handleSubmit}
        aria-label="搜尋"
        type="button"
      >
        🔍
      </button>
    </div>
  )
}

export default SearchBar
