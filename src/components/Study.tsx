import { useCallback, useEffect, useRef, useState } from 'react'
import type { Answer, Word } from '../types'
import { speak } from '../lib/tts'
import { Header, ToneHanzi, ToneLegend, WordDetail, Zh } from './ui'

const SWIPE_THRESHOLD = 80

interface Props {
  initial: Word[]
  autoSpeak: boolean
  onAnswer: (word: Word, answer: Answer) => void
  onExit: () => void
}

export function Study({ initial, autoSpeak, onAnswer, onExit }: Props) {
  const [queue, setQueue] = useState(initial)
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState<Set<string>>(new Set())
  const [againCount, setAgainCount] = useState(0)
  const [dragX, setDragX] = useState(0)
  const dragStart = useRef<number | null>(null)
  const dragDelta = useRef(0)

  const current = queue[0]

  const reveal = useCallback(() => {
    if (!current || revealed) return
    setRevealed(true)
    if (autoSpeak) void speak(current.hanzi)
  }, [current, revealed, autoSpeak])

  const answer = useCallback(
    (a: Answer) => {
      if (!current || !revealed) return
      onAnswer(current, a)
      if (a === 'know') {
        setFinished((s) => new Set(s).add(current.id))
        setQueue((q) => q.slice(1))
      } else {
        setAgainCount((n) => n + 1)
        // 「まだ」の単語は最後に回して、この学習の中でもう一度出す
        setQueue((q) => [...q.slice(1), q[0]])
      }
      setRevealed(false)
      setDragX(0)
    },
    [current, revealed, onAnswer],
  )

  // PC用：スペース/Enterでめくる、←まだ / →覚えた
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        reveal()
      } else if (e.key === 'ArrowLeft') answer('again')
      else if (e.key === 'ArrowRight') answer('know')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reveal, answer])

  if (!current) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header title="学習完了" onBack={onExit} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="text-2xl font-bold">おつかれさまでした！</h2>
          <p className="text-stone-600">
            {finished.size}語を学習しました
            {againCount > 0 && `（「まだ」${againCount}回）`}
          </p>
          <p className="text-sm text-stone-500">覚えた単語は、忘れかけたころにまた出てきます。</p>
        </main>
        <div className="safe-bottom px-4">
          <button
            type="button"
            onClick={onExit}
            className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white active:bg-brand-dark"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  const total = initial.length
  const swipeHint = dragX > 30 ? 'know' : dragX < -30 ? 'again' : null

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        title={`${Math.min(finished.size + 1, total)} / ${total}`}
        onBack={onExit}
        right={<span className="pr-3 text-xs text-stone-500">残り {queue.length}</span>}
      />
      <div className="h-1 bg-stone-200">
        <div className="h-full bg-brand transition-all" style={{ width: `${(finished.size / total) * 100}%` }} />
      </div>

      <main className="flex flex-1 flex-col px-4 py-4">
        <div
          role="button"
          tabIndex={0}
          aria-label={revealed ? '単語カード' : 'タップして答えを見る'}
          onClick={reveal}
          onPointerDown={(e) => {
            if (!revealed) return
            dragStart.current = e.clientX
            dragDelta.current = 0
            // 指がカードの外に出ても離した瞬間を受け取れるようにする
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (dragStart.current === null) return
            dragDelta.current = e.clientX - dragStart.current
            setDragX(dragDelta.current)
          }}
          onPointerUp={(e) => {
            if (dragStart.current === null) return
            const dx = e.clientX - dragStart.current
            dragStart.current = null
            if (dx > SWIPE_THRESHOLD) answer('know')
            else if (dx < -SWIPE_THRESHOLD) answer('again')
            else setDragX(0)
          }}
          onPointerCancel={() => {
            dragStart.current = null
            setDragX(0)
          }}
          style={{ transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`, touchAction: revealed ? 'pan-y' : 'auto' }}
          className={`relative flex flex-1 select-none flex-col rounded-3xl border-2 bg-white px-5 py-6 shadow-sm ${
            dragStart.current === null ? 'transition-transform' : ''
          } ${swipeHint === 'know' ? 'border-green-400' : swipeHint === 'again' ? 'border-rose-400' : 'border-stone-200'}`}
        >
          {swipeHint && (
            <span
              className={`absolute top-4 rounded-lg px-3 py-1 text-sm font-bold text-white ${
                swipeHint === 'know' ? 'left-4 bg-green-500' : 'right-4 bg-rose-500'
              }`}
            >
              {swipeHint === 'know' ? '覚えた' : 'まだ'}
            </span>
          )}

          <div className={`flex flex-col items-center justify-center ${revealed ? 'py-2' : 'flex-1'}`}>
            {revealed ? (
              <ToneHanzi word={current} className="text-6xl font-medium leading-tight" />
            ) : (
              <Zh className="text-7xl font-medium leading-tight">{current.hanzi}</Zh>
            )}
            {!revealed && <p className="mt-8 text-sm text-stone-400">読み方と意味を思い浮かべてから、タップ</p>}
          </div>

          {revealed && (
            <div className="mt-2 flex flex-1 flex-col gap-4">
              <ToneLegend />
              <WordDetail word={current} />
              <p className="mt-auto pt-2 text-center text-xs text-stone-400">← 左へスワイプ：まだ ／ 右へスワイプ：覚えた →</p>
            </div>
          )}
        </div>
      </main>

      <div className="safe-bottom px-4">
        {revealed ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => answer('again')}
              className="min-h-14 rounded-2xl border-2 border-rose-300 bg-white text-lg font-bold text-rose-600 active:bg-rose-50"
            >
              まだ
            </button>
            <button
              type="button"
              onClick={() => answer('know')}
              className="min-h-14 rounded-2xl bg-green-600 text-lg font-bold text-white active:bg-green-700"
            >
              覚えた
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={reveal}
            className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white active:bg-brand-dark"
          >
            答えを見る
          </button>
        )}
      </div>
    </div>
  )
}
