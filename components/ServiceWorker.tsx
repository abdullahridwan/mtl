'use client'

import { useEffect } from 'react'

// Registers public/sw.js, which keeps visited chapters (and all of them, via the
// home page's save button) available offline.
export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
