'use client'

import { useEffect } from 'react'

/** Registers the PWA service worker (production only, so dev reloads stay fresh). */
export function useAppShell() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
}
