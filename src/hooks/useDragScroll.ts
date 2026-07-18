import { useCallback, useEffect, useRef } from 'react'

/**
 * 讓水平滾動容器支援滑鼠拖曳捲動（drag-to-scroll）
 *
 * 使用 callback ref，支援條件渲染（展開/收合）
 *
 * 用法：
 *   const scrollRef = useDragScroll()
 *   <div ref={scrollRef} className="h-scroll-container">...
 */
export function useDragScroll() {
  const state = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    el: null as HTMLDivElement | null,
  })

  // 滑鼠按下 — 綁在元素上（透過 callback ref）
  const onMouseDown = useCallback((e: MouseEvent) => {
    const s = state.current
    const el = s.el
    if (!el) return

    // 忽略點擊連結或按鈕
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) return

    const rect = el.getBoundingClientRect()
    s.isDown = true
    s.startX = e.clientX - rect.left
    s.scrollLeft = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  // callback ref — 元素出現/消失時自動重新綁定
  const ref = useCallback((node: HTMLDivElement | null) => {
    const s = state.current

    // 移除舊元素的事件
    if (s.el) {
      s.el.removeEventListener('mousedown', onMouseDown)
      s.el.style.cursor = ''
    }

    // 設定新元素
    s.el = node

    if (node) {
      node.style.cursor = 'grab'
      node.addEventListener('mousedown', onMouseDown)
    }
  }, [onMouseDown])

  // 用 ref 存最新的 handler，避免 window 事件閉包過時
  const moveRef = useRef((e: MouseEvent) => {
    const s = state.current
    const el = s.el
    if (!s.isDown || !el) return
    e.preventDefault()
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const walk = (x - s.startX) * 1.5
    el.scrollLeft = s.scrollLeft - walk
  })

  const upRef = useRef(() => {
    const s = state.current
    const el = s.el
    if (!s.isDown || !el) return
    s.isDown = false
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  })

  // window 層級的事件（mousemove / mouseup）只需綁一次
  useEffect(() => {
    const onMove = (e: MouseEvent) => moveRef.current(e)
    const onUp = () => upRef.current()

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return ref
}
