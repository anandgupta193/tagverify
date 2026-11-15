'use client'

import { useEffect } from 'react'

/**
 * Opens a form when the URL has ?action=<name> (used by manifest shortcuts and
 * overview links), then cleans the URL so a refresh doesn't reopen it.
 */
export function useActionParam(name: string, open: () => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === name) {
      open()
      window.history.replaceState(null, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])
}
