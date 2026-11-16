import type { ReactNode } from 'react'
import type { Word } from '../types'
import { TONE_CLASS, TONE_LABEL, toneOfChars, type Tone } from '../lib/tone'
import { speak } from '../lib/tts'

/** 中国語のテキスト。lang を付けて中国本土向けフォントで表示する */
export function Zh({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span lang="zh-CN" className={className}>
      {children}
    </span>
  )
}

/** 声調ごとに色分けした漢字 */
export function ToneHanzi({ word, className = '' }: { word: Word; className?: string }) {
  return (
    <Zh className={className}>
      {toneOfChars(word).map((c, i) => (
        <span key={i} className={TONE_CLASS[c.tone]}>
          {c.char}
        </span>
      ))}
    </Zh>
  )
}

export function ToneLegend() {
  const tones: Tone[] = [1, 2, 3, 4, 0]
  return (
    <p className="flex flex-wrap justify-center gap-x-3 text-xs text-stone-500">
      {tones.map((t) => (
        <span key={t} className={TONE_CLASS[t]}>
          ● {TONE_LABEL[t]}
        </span>
      ))}
    </p>
  )
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
    </svg>
  )
}

/** 読み上げボタン。押してもカードはめくれないよう伝播を止める */
export function SpeakButton({ text, label = '再生', slow = false }: { text: string; label?: string; slow?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void speak(text, { slow })
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 active:bg-stone-100"
      aria-label={`${label}：${text}`}
    >
      <SpeakerIcon />
      {label}
    </button>
  )
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="safe-top sticky top-0 z-10 flex items-center gap-2 border-b border-stone-200 bg-paper/95 px-2 pb-2 backdrop-blur">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-full text-2xl text-stone-600 active:bg-stone-200"
          aria-label="戻る"
        >
          ‹
        </button>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="flex-1 truncate text-base font-bold">{title}</h1>
      {right}
    </header>
  )
}

export function WordDetail({ word }: { word: Word }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl font-medium tracking-wide text-stone-800">{word.pinyin}</span>
        <div className="flex gap-2">
          <SpeakButton text={word.hanzi} />
          <SpeakButton text={word.hanzi} label="ゆっくり" slow />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold">{word.ja}</p>
        <p className="mt-1 text-sm text-stone-500">
          {word.pos}
          {word.jaForm && <span className="ml-3">日本の漢字：{word.jaForm}</span>}
        </p>
      </div>
      {word.caution && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-bold">日本語と違う！</span> {word.caution}
        </p>
      )}
      <div className="rounded-xl bg-stone-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Zh className="block text-lg">{word.example.zh}</Zh>
            <p className="mt-0.5 text-sm text-stone-500">{word.example.pinyin}</p>
            <p className="mt-1 text-sm">{word.example.ja}</p>
          </div>
          <SpeakButton text={word.example.zh} label="例文" />
        </div>
      </div>
    </div>
  )
}
