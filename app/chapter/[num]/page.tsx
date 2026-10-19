import { notFound } from 'next/navigation'
import { getAvailableChapters, getChapterContent, isRetranslated, getCleaningModel, getChapterSource } from '@/lib/chapters'
import Reader from '@/components/Reader'

interface Props {
  params: { num: string }
}

// Pre-build every chapter as a static page so the offline cache can store and
// serve plain HTML for each one.
export function generateStaticParams() {
  return getAvailableChapters().map(num => ({ num: String(num) }))
}

export default function ChapterPage({ params }: Props) {
  const chapterNum = parseInt(params.num)
  if (isNaN(chapterNum)) notFound()

  const content = getChapterContent(chapterNum)
  if (!content) notFound()

  const availableChapters = getAvailableChapters()

  return (
    <Reader
      chapterNum={chapterNum}
      content={content}
      availableChapters={availableChapters}
      isRetranslated={isRetranslated(chapterNum)}
      cleaningModel={getCleaningModel(chapterNum)}
      source={getChapterSource(chapterNum)}
    />
  )
}
