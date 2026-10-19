'use client'

import { useEffect, useState } from 'react'

const CACHE = 'im-offline-v1'

// "Save all chapters for offline": asks the service worker to download every
// chapter page into the browser cache, and shows how many are saved.
export default function OfflineSave({ chapters }: { chapters: number[] }) {
  const [saved, setSaved] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const total = chapters.length

  async function countSaved() {
    try {
      const cache = await caches.open(CACHE)
      const keys = await cache.keys()
      const paths = new Set(keys.map(k => new URL(k.url).pathname))
      setSaved(chapters.filter(n => paths.has(`/chapter/${n}`)).length)
    } catch {
      setSaved(null)
    }
  }

  useEffect(() => {
    countSaved()
    if (!('serviceWorker' in navigator)) return
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'save-progress') setSaved(e.data.saved)
      if (e.data?.type === 'save-done') { setBusy(false); countSaved() }
      if (e.data?.type === 'save-error') { setBusy(false); setError(e.data.message) }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveAll() {
    setError(null)
    if (!('serviceWorker' in navigator)) {
      setError('This browser does not support offline reading.')
      return
    }
    setBusy(true)
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'save-all', urls: ['/', ...chapters.map(n => `/chapter/${n}`)] })
  }

  const allSaved = saved === total
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
      <button
        onClick={saveAll}
        disabled={busy}
        style={{
          padding: '9px 14px', borderRadius: 6, border: '1px solid var(--accent)', cursor: busy ? 'default' : 'pointer',
          background: allSaved ? 'transparent' : 'var(--accent)', color: allSaved ? 'var(--accent)' : '#fff', fontSize: 13, fontWeight: 600,
        }}
      >
        {busy ? 'Saving…' : allSaved ? 'Update offline copy' : 'Save all chapters for offline'}
      </button>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {saved == null ? '' : `${saved} of ${total} saved on this device`}
      </span>
      {error && <span style={{ color: 'var(--accent)' }}>{error}</span>}
    </div>
  )
}
