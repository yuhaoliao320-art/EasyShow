import { useCallback, useEffect, useRef } from 'react'

/**
 * 讓水平滾動容器支援滑鼠拖曳捲動（drag-to-scroll）
 *
 * 支援條件渲染（展開/收合）、可點擊連結與按鈕：
 * - 輕輕點擊 → 正常觸發連結導航
 * - 按住拖動 → 捲動容器，不放開滑鼠就不會觸發連結
 *
 * 用法：
 *   const scrollRef = useDragScroll()
 *   <div ref={scrollRef} className="h-scroll-container">...
 */
export function useDragScroll() {
  const state = useRef({
    isDown: false,
    didDrag: false,
    startX: 0,
    scrollLeft: 0,
    el: null as HTMLDivElement | null,
  })

  // ----- mousedown：一律開始追蹤 -----
  const onMouseDown = useCallback((e: MouseEvent) => {
    const s = state.current
    const el = s.el
    if (!el) return

    const rect = el.getBoundingClientRect()
    s.isDown = true
    s.didDrag = false
    s.startX = e.clientX - rect.left
    s.scrollLeft = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  // ----- mousemove：超過 5px 門檻才啟動拖曳 -----
  const onMouseMove = useCallback((e: MouseEvent) => {
    const s = state.current
    const el = s.el
    if (!s.isDown || !el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const delta = x - s.startX

    // 移動超過 5px 才算拖曳（避免誤觸）
    if (Math.abs(delta) < 5 && !s.didDrag) return

    s.didDrag = true
    e.preventDefault()
    el.scrollLeft = s.scrollLeft - delta * 1.5
  }, [])

  // ----- mouseup：若剛有拖曳，阻止點擊事件 -----
  const onMouseUp = useCallback(() => {
    const s = state.current
    const el = s.el
    if (!s.isDown || !el) return

    s.isDown = false
    el.style.cursor = 'grab'
    el.style.userSelect = ''

    if (s.didDrag) {
      // 暫時擋住 pointer events，讓接下來冒泡的 click 被無效化
      el.style.pointerEvents = 'none'
      requestAnimationFrame(() => {
        el.style.pointerEvents = ''
      })
      s.didDrag = false
    }
  }, [])

  // ----- callback ref：元素出現/消失時自動綁定 mousedown -----
  const ref = useCallback((node: HTMLDivElement | null) => {
    const s = state.current

    // 清除舊元素
    if (s.el) {
      s.el.removeEventListener('mousedown', onMouseDown)
      s.el.style.cursor = ''
      s.el.style.pointerEvents = ''
    }

    s.el = node

    if (node) {
      node.style.cursor = 'grab'
      node.addEventListener('mousedown', onMouseDown)
    }
  }, [onMouseDown])

  // ----- window 層級 mousemove / mouseup（只綁一次） -----
  const moveRef = useRef(onMouseMove)
  moveRef.current = onMouseMove

  const upRef = useRef(onMouseUp)
  upRef.current = onMouseUp

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
