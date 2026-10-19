'use client'

import { useState, useEffect } from 'react'
import OfflineSave from '@/components/OfflineSave'
import type { ChapterSummary } from '@/lib/chapters'

const THEME_VARS: Record<string, Record<string, string>> = {
  night:     { '--bg': '#0d0d0d', '--surface': '#181818', '--border': '#252525', '--text': '#e2e2e2', '--text-muted': '#555', '--accent': '#818cf8' },
  dusk:      { '--bg': '#14172a', '--surface': '#1c2038', '--border': '#252a45', '--text': '#c8d0e0', '--text-muted': '#5a6280', '--accent': '#7c85f0' },
  parchment: { '--bg': '#f3ead5', '--surface': '#ece0c4', '--border': '#d4c09a', '--text': '#3a2e1e', '--text-muted': '#8a7a5a', '--accent': '#8b6012' },
  paper:     { '--bg': '#f9f9f9', '--surface': '#efefef', '--border': '#ddd', '--text': '#1a1a1a', '--text-muted': '#888', '--accent': '#4f46e5' },
}

export default function ChapterIndex({ chapters }: { chapters: ChapterSummary[] }) {
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(false)

  // Use the reader's saved theme so the index matches it.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('im-settings') || '{}')
      const vars = THEME_VARS[saved.theme]
      if (vars) Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
    } catch {}
  }, [])

  const q = query.trim().toLowerCase()
  const shown = chapters
    .filter(c => !q || String(c.num).includes(q) || (c.subtitle ?? '').toLowerCase().includes(q))
    .sort((a, b) => (newestFirst ? b.num - a.num : a.num - b.num))

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px' }}>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, fontSize: 34, marginBottom: 6 }}>
          Infinite Mage
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          {chapters.length} chapters, {chapters[0]?.num}–{chapters[chapters.length - 1]?.num}
        </p>

        <OfflineSave chapters={chapters.map(c => c.num)} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            id="chapter-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by number or title"
            aria-label="Search chapters"
            style={{
              flex: '1 1 220px', padding: '10px 12px', borderRadius: 6, fontSize: 14,
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none',
            }}
          />
          <button
            onClick={() => setNewestFirst(n => !n)}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}
          >
            {newestFirst ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        <ul style={{ listStyle: 'none' }}>
          {shown.map(c => (
            <li key={c.num} style={{ borderBottom: '1px solid var(--border)' }}>
              <a
                href={`/chapter/${c.num}`}
                style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '12px 4px', color: 'var(--text)', textDecoration: 'none' }}
              >
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', fontSize: 13, minWidth: 40 }}>{c.num}</span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 16 }}>
                  {c.subtitle ?? `Chapter ${c.num}`}
                </span>
                {(c.source === 'pdf' || c.retranslated) && (
                  <span
                    title={c.model ? `Cleaned with ${c.model}` : undefined}
                    style={{ fontSize: 11, color: 'var(--accent)', whiteSpace: 'nowrap' }}
                  >
                    {c.source === 'pdf' ? 'PDF edit' : 'Retranslated'}
                    {c.model ? ` · ${c.model.split('/').pop()}` : ''}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 4px' }}>No chapter matches "{query}".</p>
        )}
      </main>
    </div>
  )
}
