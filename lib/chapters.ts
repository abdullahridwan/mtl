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

// Chapters cleaned from user-supplied PDFs by ../pdf_clean.py (a light-touch
// pass: pronouns, names, and only the incomprehensible sentences). These take
// precedence over a scraped chapter with the same number.
const PDF_DIR = path.join(process.cwd(), 'public', 'pdf_chapters')
const PDF_META_PATH = path.join(process.cwd(), 'public', 'pdf_meta.json')

interface ChapterMeta {
  model: string
  cleaned_at: string
}

export type ChapterSource = 'pdf' | 'web'

let metaCache: Record<string, ChapterMeta> | null = null
let pdfMetaCache: Record<string, ChapterMeta> | null = null

function readJson(file: string): Record<string, ChapterMeta> {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {}
}

function loadMeta(): Record<string, ChapterMeta> {
  if (!metaCache) metaCache = readJson(META_PATH)
  return metaCache
}

function loadPdfMeta(): Record<string, ChapterMeta> {
  if (!pdfMetaCache) pdfMetaCache = readJson(PDF_META_PATH)
  return pdfMetaCache
}

function listChapterFiles(dir: string): number[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.match(/^chapter_\d+\.txt$/))
    .map(f => parseInt(f.replace('chapter_', '').replace('.txt', '')))
}

function pdfChapterPath(num: number): string {
  return path.join(PDF_DIR, `chapter_${num}.txt`)
}

export function getChapterSource(num: number): ChapterSource {
  return fs.existsSync(pdfChapterPath(num)) ? 'pdf' : 'web'
}

// Chapters cleaned by the current glossary-aware pass (recorded in
// clean_meta.json), vs. the older gpt-4.1-mini pass that predates the
// manifest and had no cross-chapter character glossary. Not tied to any
// specific model name -- the cleaning model changes over time (see
// clean_meta.json for which model cleaned a given chapter).
export function isRetranslated(num: number): boolean {
  return getChapterSource(num) === 'web' && !!loadMeta()[String(num)]
}

export function getCleaningModel(num: number): string | null {
  const meta = getChapterSource(num) === 'pdf' ? loadPdfMeta() : loadMeta()
  return meta[String(num)]?.model ?? null
}

export function getAvailableChapters(): number[] {
  const all = new Set([...listChapterFiles(CLEAN_DIR), ...listChapterFiles(PDF_DIR)])
  return Array.from(all).sort((a, b) => a - b)
}

export function getChapterContent(num: number): string | null {
  const pdfPath = pdfChapterPath(num)
  const filePath = fs.existsSync(pdfPath) ? pdfPath : path.join(CLEAN_DIR, `chapter_${num}.txt`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}
