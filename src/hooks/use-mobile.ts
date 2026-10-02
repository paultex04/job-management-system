import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Subscribes to the mobile media query as an external store (SSR snapshot:
 * desktop), so hydration stays consistent and no state is set from an effect.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  )
}
