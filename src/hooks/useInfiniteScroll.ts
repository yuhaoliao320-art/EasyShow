import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================
   useInfiniteScroll — 通用無限滾動 Hook
   支援 IntersectionObserver、AbortController、重試邏輯
   ============================================ */

export interface UseInfiniteScrollOptions {
  /** 每頁筆數，預設 12 */
  pageSize?: number
  /** IntersectionObserver rootMargin（px），預設 200 */
  threshold?: number
}

export interface UseInfiniteScrollResult<T> {
  /** 已載入的資料陣列 */
  items: T[]
  /** 是否還有更多資料 */
  hasMore: boolean
  /** 是否正在載入 */
  loading: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 載入下一頁 */
  loadMore: () => void
  /** 重置所有資料（重新開始） */
  reset: () => void
  /** 重試最後一次失敗 */
  retry: () => void
  /** 要掛載在 sentinel 元素上的 callback ref */
  sentinelRef: (node: HTMLElement | null) => void
  /** 可選：掛載在 scroll container 上的 callback ref（作為 intersection root） */
  containerRef: (node: HTMLElement | null) => void
}

export function useInfiniteScroll<T>(
  fetchFn: (params: {
    limit: number
    offset: number
    signal?: AbortSignal
  }) => Promise<{ items: T[]; total: number }>,
  options?: UseInfiniteScrollOptions
): UseInfiniteScrollResult<T> {
  const pageSize = options?.pageSize ?? 12
  const marginPx = options?.threshold ?? 200

  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 用 ref 追蹤狀態以避免 stale closure
  const itemsRef = useRef<T[]>([])
  const offsetRef = useRef(0)
  const totalRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sentinelElRef = useRef<HTMLElement | null>(null)
  const containerElRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const fetchFnRef = useRef(fetchFn)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // 保持 fetchFn 參照最新
  fetchFnRef.current = fetchFn

  const hasMore = total === null || offsetRef.current < total

  // 更新 refs 以保持同步
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    totalRef.current = total
  }, [total])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  /** 取消進行中的請求 */
  const cancelRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  /** 執行實際的 fetch */
  const doFetch = useCallback(
    async (isRetry: boolean = false) => {
      // 如果已取消或沒有更多資料則跳過
      if (hasMoreRef.current === false && !isRetry) return

      cancelRequest()

      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const offset = offsetRef.current
        const result = await fetchFnRef.current({
          limit: pageSize,
          offset,
          signal: controller.signal,
        })

        // 請求完成後檢查是否被取消
        if (controller.signal.aborted) return

        setItems((prev) => {
          // 如果 offset 為 0（reset 後），取代而非累加
          const newItems = offset === 0 ? result.items : [...prev, ...result.items]
          itemsRef.current = newItems
          return newItems
        })

        setTotal(result.total)
        totalRef.current = result.total
        offsetRef.current = offset + result.items.length

        // 重置重試計數
        retryCountRef.current = 0
      } catch (err: any) {
        // AbortError 不視為錯誤
        if (err?.name === 'AbortError') return

        setError(err?.message ?? '載入失敗')
        retryCountRef.current += 1
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [pageSize, cancelRequest]
  )

  /** 載入下一頁 */
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return
    doFetch()
  }, [doFetch])

  /** 重置 */
  const reset = useCallback(() => {
    cancelRequest()
    offsetRef.current = 0
    totalRef.current = null
    hasMoreRef.current = true
    retryCountRef.current = 0
    setItems([])
    setTotal(null)
    setError(null)
    setLoading(false)
    itemsRef.current = []
  }, [cancelRequest])

  /** 重試 */
  const retry = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      retryCountRef.current = 0
      offsetRef.current = 0
    }
    doFetch(true)
  }, [doFetch])

  // 建立 IntersectionObserver 的回調
  const setupObserver = useCallback(() => {
    // 移除舊 observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const sentinel = sentinelElRef.current
    if (!sentinel) return

    const root = containerElRef.current ?? null
    const rootMargin = `${marginPx}px`

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { root, rootMargin }
    )

    observerRef.current.observe(sentinel)
  }, [loadMore, marginPx])

  // sentinelRef callback
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      sentinelElRef.current = node
      if (node) {
        setupObserver()
      }
    },
    [setupObserver]
  )

  // containerRef callback
  const containerRef = useCallback((node: HTMLElement | null) => {
    containerElRef.current = node
  }, [])

  // 清理 observer 和請求
  useEffect(() => {
    return () => {
      cancelRequest()
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [cancelRequest])

  return {
    items,
    hasMore,
    loading,
    error,
    loadMore,
    reset,
    retry,
    sentinelRef,
    containerRef,
  }
}
