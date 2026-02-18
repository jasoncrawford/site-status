import { describe, test, expect, vi, beforeEach } from "vitest"

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

// Mock Supabase browser client
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
}
// Make .on() chainable
mockOn.mockReturnValue(mockChannel)

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

// Mock react
const cleanupFns: (() => void)[] = []
vi.mock("react", async () => {
  const actual = await vi.importActual("react")
  return {
    ...actual,
    useEffect: (fn: () => (() => void) | void) => {
      const cleanup = fn()
      if (cleanup) cleanupFns.push(cleanup)
    },
    useMemo: (fn: () => unknown) => fn(),
  }
})

import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"

describe("useRealtimeSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanupFns.length = 0
    mockOn.mockReturnValue(mockChannel)
  })

  test("subscribes to specified tables", () => {
    useRealtimeSubscription([
      { table: "checks" },
      { table: "incidents" },
    ])

    expect(mockOn).toHaveBeenCalledTimes(2)
    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ table: "checks", event: "*", schema: "public" }),
      expect.any(Function)
    )
    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ table: "incidents", event: "*", schema: "public" }),
      expect.any(Function)
    )
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
  })

  test("subscribes with filter when provided", () => {
    useRealtimeSubscription([
      { table: "checks", filter: "site_id=eq.site-1" },
    ])

    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "checks",
        filter: "site_id=eq.site-1",
      }),
      expect.any(Function)
    )
  })

  test("calls router.refresh on change", () => {
    useRealtimeSubscription([{ table: "checks" }])

    // Get the callback passed to .on()
    const callback = mockOn.mock.calls[0][2]
    callback()

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  test("removes channel on cleanup", () => {
    useRealtimeSubscription([{ table: "checks" }])

    expect(cleanupFns).toHaveLength(1)
    cleanupFns[0]()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })
})
