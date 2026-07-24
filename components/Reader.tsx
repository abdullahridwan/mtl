'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'night' | 'dusk' | 'parchment' | 'paper'
type Font = 'classic' | 'modern' | 'scholar'

const THEMES: Record<Theme, Record<string, string>> = {
  night:     { '--bg': '#0d0d0d', '--surface': '#181818', '--border': '#252525', '--text': '#e2e2e2', '--text-muted': '#555', '--accent': '#818cf8' },
  dusk:      { '--bg': '#14172a', '--surface': '#1c2038', '--border': '#252a45', '--text': '#c8d0e0', '--text-muted': '#5a6280', '--accent': '#7c85f0' },
  parchment: { '--bg': '#f3ead5', '--surface': '#ece0c4', '--border': '#d4c09a', '--text': '#3a2e1e', '--text-muted': '#8a7a5a', '--accent': '#8b6012' },
  paper:     { '--bg': '#f9f9f9', '--surface': '#efefef', '--border': '#ddd', '--text': '#1a1a1a', '--text-muted': '#888', '--accent': '#4f46e5' },
}

const FONTS: Record<Font, string> = {
  classic: 'Georgia, "Times New Roman", serif',
  modern:  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  scholar: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
}

interface ReaderProps {
  chapterNum: number
  content: string
  availableChapters: number[]
  isRetranslated?: boolean
  cleaningModel?: string | null
}

export default function Reader({ chapterNum, content, availableChapters, isRetranslated, cleaningModel }: ReaderProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('night')
  const [font, setFont] = useState<Font>('classic')
  const [fontSize, setFontSize] = useState(19)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [jumpInput, setJumpInput] = useState('')
  const jumpInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const idx = availableChapters.indexOf(chapterNum)
  const prevChapter = idx > 0 ? availableChapters[idx - 1] : null
  const nextChapter = idx < availableChapters.length - 1 ? availableChapters[idx + 1] : null

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('im-settings')
      if (saved) {
        const s = JSON.parse(saved)
        if (s.theme) setTheme(s.theme)
        if (s.font) setFont(s.font)
        if (s.fontSize) setFontSize(s.fontSize)
      }
    } catch {}
  }, [])

  // Persist settings
  useEffect(() => {
    localStorage.setItem('im-settings', JSON.stringify({ theme, font, fontSize }))
  }, [theme, font, fontSize])

  // Apply CSS variables
  useEffect(() => {
    const vars = THEMES[theme]
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
  }, [theme])

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [chapterNum])

  // Focus jump input when modal opens
  useEffect(() => {
    if (jumpOpen) setTimeout(() => jumpInputRef.current?.focus(), 50)
  }, [jumpOpen])

  const navigate = useCallback((num: number) => {
    router.push(`/chapter/${num}`)
  }, [router])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (jumpOpen || settingsOpen) return
      if (e.key === 'ArrowLeft' && prevChapter) navigate(prevChapter)
      if (e.key === 'ArrowRight' && nextChapter) navigate(nextChapter)
      if (e.key === 'Escape') { setSettingsOpen(false); setJumpOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevChapter, nextChapter, jumpOpen, settingsOpen, navigate])

  const handleJump = () => {
    const num = parseInt(jumpInput)
    if (availableChapters.includes(num)) {
      navigate(num)
      setJumpOpen(false)
      setJumpInput('')
    }
  }

  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', transition: 'background 0.2s, color 0.2s' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Infinite Mage
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>
            Chapter {chapterNum}
            {isRetranslated && (
              <span
                title={`Cleaned with an improved translation pass (consistent character gender/names, better coherence)${cleaningModel ? ` -- model: ${cleaningModel}` : ''}`}
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999,
                  padding: '2px 8px', whiteSpace: 'nowrap',
                }}
              >
                ✨ Retranslated
              </span>
            )}
          </span>
          <button
            onClick={() => { setSettingsOpen(o => !o); setJumpOpen(false) }}
            aria-label="Settings"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 4, fontSize: 17, lineHeight: 1 }}
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Chapter content */}
      <main ref={contentRef} style={{ maxWidth: 660, margin: '0 auto', padding: '52px 24px 140px', fontFamily: FONTS[font] }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 48 }}>
          Chapter {chapterNum}
          {isRetranslated && (
            <span
              title={cleaningModel ? `Cleaned with model: ${cleaningModel}` : undefined}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999,
                padding: '2px 8px', whiteSpace: 'nowrap',
              }}>
              ✨ Retranslated
            </span>
          )}
          {cleaningModel && (
            <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none', whiteSpace: 'nowrap' }}>
              {cleaningModel.split('/').pop()}
            </span>
          )}
        </p>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize, lineHeight: 1.9, marginBottom: '1.6em', color: 'var(--text)' }}>
            {para}
          </p>
        ))}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: 'system-ui, sans-serif' }}>
          <NavBtn onClick={() => prevChapter && navigate(prevChapter)} disabled={!prevChapter}>
            ← Prev
          </NavBtn>
          <button
            onClick={() => { setJumpOpen(true); setSettingsOpen(false) }}
            style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
          >
            {idx + 1} / {availableChapters.length}
          </button>
          <NavBtn onClick={() => nextChapter && navigate(nextChapter)} disabled={!nextChapter}>
            Next →
          </NavBtn>
        </div>
      </nav>

      {/* Settings panel */}
      {settingsOpen && (
        <>
          <div onClick={() => setSettingsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.5)' }} />
          <aside style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 99,
            width: 270, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            padding: 28, overflowY: 'auto', fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Reading Style</span>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            <Section label="Background">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['night', 'dusk', 'parchment', 'paper'] as Theme[]).map(t => (
                  <OptionBtn key={t} active={theme === t} onClick={() => setTheme(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </OptionBtn>
                ))}
              </div>
            </Section>

            <Section label="Philosophy">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['classic', 'modern', 'scholar'] as Font[]).map(f => (
                  <button key={f} onClick={() => setFont(f)} style={{
                    padding: '9px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                    border: `1px solid ${font === f ? 'var(--accent)' : 'var(--border)'}`,
                    background: font === f ? 'var(--accent)' : 'transparent',
                    color: font === f ? '#fff' : 'var(--text)',
                    fontFamily: FONTS[f],
                  }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Text Size">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SizeBtn onClick={() => setFontSize(s => Math.max(14, s - 1))}>−</SizeBtn>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 14, color: 'var(--text)' }}>{fontSize}px</span>
                <SizeBtn onClick={() => setFontSize(s => Math.min(28, s + 1))}>+</SizeBtn>
              </div>
            </Section>
          </aside>
        </>
      )}

      {/* Jump modal */}
      {jumpOpen && (
        <>
          <div onClick={() => setJumpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 198, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 199, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 24, width: 300, fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--text)' }}>Jump to Chapter</div>
            <input
              ref={jumpInputRef}
              type="number"
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJump()}
              placeholder={`${availableChapters[0]}–${availableChapters[availableChapters.length - 1]}`}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 6, fontSize: 15,
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setJumpOpen(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={handleJump} style={{ flex: 1, padding: '9px 0', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Go
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  )
}

function OptionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 0', borderRadius: 6, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text)',
    }}>
      {children}
    </button>
  )
}

function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border)',
      background: 'transparent', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--text-muted)' : 'var(--text)',
      fontSize: 14, opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s',
    }}>
      {children}
    </button>
  )
}

function SizeBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)',
      background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 18, lineHeight: 1,
    }}>
      {children}
    </button>
  )
}
