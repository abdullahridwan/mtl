import { getChapterIndex } from '@/lib/chapters'
import ChapterIndex from '@/components/ChapterIndex'

export default function Home() {
  return <ChapterIndex chapters={getChapterIndex()} />
}
