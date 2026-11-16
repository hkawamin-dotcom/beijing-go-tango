import type { Settings } from '../lib/db'
import { SLOW_LEVELS, speak, type SlowLevel } from '../lib/tts'
import { Header, SpeakButton } from './ui'
import { VoiceDiagnostics } from './VoiceDiagnostics'

const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20]
const SAMPLE = '你好，我是你的汉语老师。'

interface Props {
  settings: Settings
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReset: () => void
  onBack: () => void
}

export function SettingsScreen({ settings, onChange, onReset, onBack }: Props) {
  return (
    <div className="min-h-dvh">
      <Header title="設定" onBack={onBack} />
      <main className="safe-bottom mx-auto max-w-md space-y-4 px-4 py-4">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="font-bold">1日の新しい単語の数</h2>
          <p className="mt-1 text-sm text-stone-500">多すぎると、数日後の復習が増えて続けにくくなります。</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {NEW_PER_DAY_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange('newPerDay', n)}
                aria-pressed={settings.newPerDay === n}
                className={`min-h-11 rounded-xl font-bold ${
                  settings.newPerDay === n ? 'bg-brand text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {n}語
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span>
              <span className="block font-bold">答えを開いたら自動で読み上げ</span>
              <span className="block text-sm text-stone-500">音を出せない場所ではオフに</span>
            </span>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onChange('autoSpeak', e.target.checked)}
              className="size-6 accent-brand"
            />
          </label>
          <div className="mt-3 flex items-center gap-3 border-t border-stone-100 pt-3">
            <span className="text-sm text-stone-600">音声のテスト</span>
            <SpeakButton text={SAMPLE} label="普通" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="font-bold">「ゆっくり」の速さ</h2>
          <p className="mt-1 text-sm text-stone-500">
            遅くしすぎると、端末によっては音が伸びて歪みます。聞き比べて、聞き取りやすいものを選んでください。
          </p>
          <div className="mt-3 space-y-2">
            {(Object.keys(SLOW_LEVELS) as SlowLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange('slowLevel', level)}
                  aria-pressed={settings.slowLevel === level}
                  className={`min-h-11 flex-1 rounded-xl px-3 text-left font-bold ${
                    settings.slowLevel === level ? 'bg-brand text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {SLOW_LEVELS[level].label}
                  {level === 'medium' && <span className="ml-1 text-xs font-normal">（おすすめ）</span>}
                </button>
                <button
                  type="button"
                  onClick={() => void speak(SAMPLE, { slow: true, level })}
                  className="min-h-11 shrink-0 rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 active:bg-stone-100"
                  aria-label={`${SLOW_LEVELS[level].label}で試聴`}
                >
                  試聴
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="font-bold">学習記録</h2>
          <p className="mt-1 text-sm text-stone-500">
            記録はこの端末のブラウザ内に保存されています。ブラウザのデータを消すと記録も消えます。
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('すべての学習記録を消して、最初からやり直しますか？\nこの操作は元に戻せません。')) onReset()
            }}
            className="mt-3 min-h-11 w-full rounded-xl border-2 border-rose-300 font-bold text-rose-600 active:bg-rose-50"
          >
            学習記録をリセット
          </button>
        </section>

        <VoiceDiagnostics />

        <p className="text-center text-xs text-stone-400">
          単語：新HSK（2021年基準）1級より抜粋 ／ 訳・例文：自作
        </p>
      </main>
    </div>
  )
}
