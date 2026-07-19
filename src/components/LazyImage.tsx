import React, { useState, useCallback } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  eager?: boolean
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '', eager = false }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
    setLoaded(true)
  }, [])

  if (error) {
    return (
      <div className={`lazy-image-wrapper lazy-image-error ${className}`}>
        <span className="lazy-image-error-icon">📷</span>
        <span className="lazy-image-error-text">圖片無法載入</span>
      </div>
    )
  }

  return (
    <div className={`lazy-image-wrapper ${className}`}>
      {!loaded && <div className="lazy-image-placeholder skeleton" />}
      <img
        src={src}
        alt={alt}
        loading={eager ? undefined : 'lazy'}
        className={`lazy-image-img ${loaded ? 'lazy-image-loaded' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

export default LazyImage
