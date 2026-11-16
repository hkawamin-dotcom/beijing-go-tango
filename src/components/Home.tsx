import { useEffect, useState } from 'react'
import type { Progress, Word } from '../types'
import { summarize } from '../lib/srs'
import { loadChineseVoice, ttsSupported } from '../lib/tts'
import { Zh } from './ui'

interface Props {
  words: Word[]
  progress: Map<string, Progress>
  dueCount: number
  newCount: number
  onStart: () => void
  onExtra: () => void
  onList: () => void
  onSettings: () => void
}

function VoiceNotice() {
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!ttsSupported()) {
      setMissing(true)
      return
    }
    void loadChineseVoice().then((v) => setMissing(!v))
  }, [])
  if (!missing) return null
  return (
    <details className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <summary className="cursor-pointer font-bold">中国語の音声が見つかりません</summary>
      <div className="mt-2 space-y-1.5">
        <p>端末に中国語（中国本土）の読み上げ音声を追加すると、発音を聞けるようになります。</p>
        <p>
          <span className="font-bold">iPhone：</span>設定 → アクセシビリティ → 読み上げコンテンツ → 声 →
          中国語（中国本土）を選んでダウンロード
        </p>
        <p>
          <span className="font-bold">Android：</span>設定 → システム → 言語 → 音声出力 → 優先するエンジンの設定 →
          音声データをインストール → 中国語（中国本土）
        </p>
        <p className="text-xs">※ メニュー名は機種やOSのバージョンで少し違うことがあります。追加後にアプリを開き直してください。</p>
      </div>
    </details>
  )
}

export function Home({ words, progress, dueCount, newCount, onStart, onExtra, onList, onSettings }: Props) {
  const s = summarize(words, progress)
  const todayTotal = dueCount + newCount
  const learnedPct = (s.learned / s.total) * 100
  const learningPct = (s.learning / s.total) * 100

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4">
      <header className="pt-4 text-center">
        <p className="text-sm font-medium text-brand">新HSK 1級</p>
        <h1 className="mt-1 text-2xl font-bold">
          <Zh>北京话</Zh> 単語カード
        </h1>
      </header>

      <VoiceNotice />

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-sm font-bold text-stone-500">今日の学習</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-orange-50 py-3">
            <p className="text-3xl font-bold text-brand">{dueCount}</p>
            <p className="text-xs text-stone-600">復習</p>
          </div>
          <div className="rounded-2xl bg-sky-50 py-3">
            <p className="text-3xl font-bold text-sky-700">{newCount}</p>
            <p className="text-xs text-stone-600">新しい単語</p>
          </div>
        </div>
        {todayTotal > 0 ? (
          <button
            type="button"
            onClick={onStart}
            className="mt-4 min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow active:bg-brand-dark"
          >
            学習を始める（{todayTotal}語）
          </button>
        ) : (
          <div className="mt-4 space-y-3 text-center">
            <p className="font-bold text-green-700">今日の学習は完了です！</p>
            {s.new > 0 && (
              <button
                type="button"
                onClick={onExtra}
                className="min-h-12 w-full rounded-2xl border-2 border-brand text-base font-bold text-brand active:bg-orange-50"
              >
                もっと新しい単語を学ぶ
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-stone-500">これまでの成果</h2>
          <p className="text-sm">
            <span className="text-xl font-bold text-green-700">{s.learned}</span> / {s.total}語 覚えた
          </p>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
          <div className="bg-green-600" style={{ width: `${learnedPct}%` }} />
          <div className="bg-amber-400" style={{ width: `${learningPct}%` }} />
        </div>
        <p className="mt-2 flex gap-4 text-xs text-stone-600">
          <span className="text-green-700">● 覚えた {s.learned}</span>
          <span className="text-amber-700">● 学習中 {s.learning}</span>
          <span className="text-stone-500">● 未学習 {s.new}</span>
        </p>
      </section>

      <nav className="mt-auto grid grid-cols-2 gap-3 pb-2">
        <button
          type="button"
          onClick={onList}
          className="min-h-12 rounded-2xl bg-white font-bold shadow-sm ring-1 ring-stone-200 active:bg-stone-100"
        >
          単語一覧
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="min-h-12 rounded-2xl bg-white font-bold shadow-sm ring-1 ring-stone-200 active:bg-stone-100"
        >
          設定
        </button>
      </nav>
    </div>
  )
}
