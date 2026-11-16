import { useMemo, useState } from 'react'
import type { Progress, Word } from '../types'
import { statusOf, type WordStatus } from '../lib/srs'
import { stripTones } from '../lib/tone'
import { Header, ToneHanzi, WordDetail } from './ui'

const FILTERS: { key: WordStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'new', label: '未学習' },
  { key: 'learning', label: '学習中' },
  { key: 'learned', label: '覚えた' },
]

const STATUS_DOT: Record<WordStatus, string> = {
  new: 'bg-stone-300',
  learning: 'bg-amber-400',
  learned: 'bg-green-600',
}

export function WordList({ words, progress, onBack }: { words: Word[]; progress: Map<string, Progress>; onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<WordStatus | 'all'>('all')
  const [open, setOpen] = useState<string | null>(null)

  const list = useMemo(() => {
    const q = query.trim()
    const qPinyin = stripTones(q)
    return words.filter((w) => {
      if (filter !== 'all' && statusOf(progress.get(w.id)) !== filter) return false
      if (!q) return true
      return w.hanzi.includes(q) || w.ja.includes(q) || (qPinyin !== '' && stripTones(w.pinyin).includes(qPinyin))
    })
  }, [words, progress, query, filter])

  return (
    <div className="min-h-dvh">
      <Header title={`単語一覧（${list.length}語）`} onBack={onBack} />
      <div className="sticky top-[calc(max(0.75rem,env(safe-area-inset-top))+3.25rem)] z-10 space-y-2 bg-paper px-4 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="漢字・ピンイン・日本語で検索"
          className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-brand"
        />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`min-h-9 shrink-0 rounded-full px-4 text-sm font-medium ${
                filter === f.key ? 'bg-brand text-white' : 'bg-white text-stone-700 ring-1 ring-stone-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="safe-bottom divide-y divide-stone-200 px-4">
        {list.map((w) => {
          const isOpen = open === w.id
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : w.id)}
                className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                aria-expanded={isOpen}
              >
                <span className={`size-2.5 shrink-0 rounded-full ${STATUS_DOT[statusOf(progress.get(w.id))]}`} />
                <ToneHanzi word={w} className="w-20 shrink-0 text-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-stone-500">{w.pinyin}</span>
                  <span className="block truncate">{w.ja}</span>
                </span>
                {w.caution && <span className="shrink-0 rounded bg-amber-100 px-1.5 text-xs text-amber-800">注意</span>}
              </button>
              {isOpen && (
                <div className="pb-4">
                  <WordDetail word={w} />
                </div>
              )}
            </li>
          )
        })}
        {list.length === 0 && <li className="py-10 text-center text-stone-500">見つかりませんでした</li>}
      </ul>
    </div>
  )
}
