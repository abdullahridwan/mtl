import fs from 'fs'
import path from 'path'

const publicChapters = path.join(process.cwd(), 'public', 'chapters')
const CLEAN_DIR = fs.existsSync(publicChapters)
  ? publicChapters
  : path.join(process.cwd(), '..', 'clean')

const publicMeta = path.join(process.cwd(), 'public', 'clean_meta.json')
const META_PATH = fs.existsSync(publicMeta)
  ? publicMeta
  : path.join(process.cwd(), '..', 'clean_meta.json')

interface ChapterMeta {
  model: string
  cleaned_at: string
}

let metaCache: Record<string, ChapterMeta> | null = null

function loadMeta(): Record<string, ChapterMeta> {
  if (metaCache) return metaCache
  if (!fs.existsSync(META_PATH)) {
    metaCache = {}
    return metaCache
  }
  metaCache = JSON.parse(fs.readFileSync(META_PATH, 'utf-8'))
  return metaCache!
}

// Chapters cleaned by the current glossary-aware pass (recorded in
// clean_meta.json), vs. the older gpt-4.1-mini pass that predates the
// manifest and had no cross-chapter character glossary. Not tied to any
// specific model name -- the cleaning model changes over time (see
// clean_meta.json for which model cleaned a given chapter).
export function isRetranslated(num: number): boolean {
  return !!loadMeta()[String(num)]
}

export function getCleaningModel(num: number): string | null {
  return loadMeta()[String(num)]?.model ?? null
}

export function getAvailableChapters(): number[] {
  if (!fs.existsSync(CLEAN_DIR)) return []
  return fs
    .readdirSync(CLEAN_DIR)
    .filter(f => f.match(/^chapter_\d+\.txt$/))
    .map(f => parseInt(f.replace('chapter_', '').replace('.txt', '')))
    .sort((a, b) => a - b)
}

export function getChapterContent(num: number): string | null {
  const filePath = path.join(CLEAN_DIR, `chapter_${num}.txt`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}
