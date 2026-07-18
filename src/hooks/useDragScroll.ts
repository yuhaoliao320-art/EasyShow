import { useEffect, useRef, useCallback } from 'react'

/**
 * 讓水平滾動容器支援滑鼠拖曳捲動（drag-to-scroll）
 *
 * 用法：
 *   const scrollRef = useDragScroll()
 *   <div ref={scrollRef} className="h-scroll-container">...
 */
export function useDragScroll() {
  const ref = useRef<HTMLDivElement | null>(null)
  const state = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  })

  const onMouseDown = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return

    // 忽略點擊連結或按鈕的事件
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) return

    state.current.isDown = true
    state.current.startX = e.pageX - el.offsetLeft
    state.current.scrollLeft = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!state.current.isDown || !el) return

    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - state.current.startX) * 1.5 // 乘數控制滑動靈敏度
    el.scrollLeft = state.current.scrollLeft - walk
  }, [])

  const onMouseUp = useCallback(() => {
    const el = ref.current
    if (!state.current.isDown || !el) return
    state.current.isDown = false
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 預設顯示 grab 游標（桌面版）
    el.style.cursor = 'grab'

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.style.cursor = ''
    }
  }, [onMouseDown, onMouseMove, onMouseUp])

  return ref
}
