import { useCallback, useEffect, useRef } from 'react'

/**
 * 讓水平滾動容器支援滑鼠拖曳捲動（drag-to-scroll）
 *
 * 支援條件渲染、可點擊連結：
 * - 輕按 → 正常導航
 * - 按住拖曳 → 即時跟隨滑鼠捲動，放開不回彈
 */
export function useDragScroll() {
  const s = useRef({
    down: false,
    dragged: false,
    startX: 0,
    startScroll: 0,
    el: null as HTMLDivElement | null,
  })

  // ----- 按下：記錄起點 -----
  const onDown = useCallback((e: MouseEvent) => {
    const st = s.current
    const el = st.el
    if (!el) return

    st.down = true
    st.dragged = false
    st.startX = e.clientX
    st.startScroll = el.scrollLeft
  }, [])

  // ----- 移動：超過 5px 啟動拖曳 -----
  const onMove = useCallback((e: MouseEvent) => {
    const st = s.current
    const el = st.el
    if (!st.down || !el) return

    const dx = e.clientX - st.startX

    // 未達門檻且尚未拖曳 => 忽略
    if (Math.abs(dx) < 5 && !st.dragged) return

    if (!st.dragged) {
      // **第一次跨過門檻**
      st.dragged = true
      el.style.pointerEvents = 'none' // 阻斷連結，避免 hover/selection 干擾
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
      el.style.scrollSnapType = 'none'
    }

    e.preventDefault()
    el.scrollLeft = st.startScroll - dx
  }, [])

  // ----- 放開：清理 -----
  const onUp = useCallback(() => {
    const st = s.current
    const el = st.el
    if (!st.down || !el) return

    st.down = false

    if (st.dragged) {
      el.style.pointerEvents = ''
      el.style.cursor = ''
      el.style.userSelect = ''
      el.style.scrollSnapType = ''
      st.dragged = false
    }
  }, [])

  // ----- callback ref：元素出現時綁 mousedown -----
  const ref = useCallback((node: HTMLDivElement | null) => {
    const st = s.current

    // 清除舊元素
    if (st.el) {
      st.el.removeEventListener('mousedown', onDown)
      st.el.style.cursor = ''
      st.el.style.pointerEvents = ''
      st.el.style.scrollSnapType = ''
    }

    st.el = node

    if (node) {
      node.style.cursor = 'grab'
      node.addEventListener('mousedown', onDown)
    }
  }, [onDown])

  // ----- window 層級 mousemove / mouseup -----
  const moveRef = useRef(onMove)
  moveRef.current = onMove
  const upRef = useRef(onUp)
  upRef.current = onUp

  useEffect(() => {
    const m = (e: MouseEvent) => moveRef.current(e)
    const u = () => upRef.current()
    window.addEventListener('mousemove', m)
    window.addEventListener('mouseup', u)
    return () => {
      window.removeEventListener('mousemove', m)
      window.removeEventListener('mouseup', u)
    }
  }, [])

  return ref
}
