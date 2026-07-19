import { useEffect, useRef } from 'react'
import { trackProductView } from '../api/products'

function getVisitorId(): string {
  let id = sessionStorage.getItem('easyshow_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('easyshow_visitor_id', id)
  }
  return id
}

function getSessionId(): string {
  let id = sessionStorage.getItem('easyshow_session_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('easyshow_session_id', id)
  }
  return id
}

export function useTrackView(productId: number | undefined): void {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (productId === undefined || productId === null) return
    if (trackedRef.current) return

    const timer = setTimeout(() => {
      const visitorId = getVisitorId()
      const sessionId = getSessionId()
      trackProductView(productId, visitorId, sessionId).catch(() => {})
      trackedRef.current = true
    }, 1000)

    return () => clearTimeout(timer)
  }, [productId])
}
