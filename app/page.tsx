import { redirect } from 'next/navigation'
import { getAvailableChapters } from '@/lib/chapters'

export default function Home() {
  const chapters = getAvailableChapters()
  if (chapters.length === 0) redirect('/no-chapters')
  redirect(`/chapter/${chapters[0]}`)
}
