import { notFound } from 'next/navigation'
import { getAvailableChapters, getChapterContent, isRetranslated } from '@/lib/chapters'
import Reader from '@/components/Reader'

interface Props {
  params: { num: string }
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
    />
  )
}
