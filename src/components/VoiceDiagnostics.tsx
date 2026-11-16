import { useState } from 'react'
import { DIAG_STEPS, runDiagnostics, voiceInfo, type DiagResult } from '../lib/ttsDiagnostics'

export function VoiceDiagnostics() {
  const [results, setResults] = useState<DiagResult[]>([])
  const [info, setInfo] = useState('')
  const [running, setRunning] = useState(false)

  const start = async () => {
    setRunning(true)
    setResults([])
    setInfo(await voiceInfo())
    await runDiagnostics(setResults)
    setRunning(false)
  }

  const report = [
    `アプリ版: ${__APP_VERSION__}`,
    info,
    ...results.map((r) => `${r.label}: ${r.ms !== null ? `${(r.ms / 1000).toFixed(2)}秒` : r.note}`),
  ].join('\n')

  return (
    <details className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <summary className="cursor-pointer font-bold">音声の診断（不具合の調査用）</summary>
      <p className="mt-2 text-sm text-stone-500">
        同じ文を{DIAG_STEPS.length}回、速さを変えて読み上げ、かかった時間を測ります（約30秒）。マナーモードを解除してから押し、音が歪む段階がないかも聞いてください。
      </p>
      <button
        type="button"
        onClick={() => void start()}
        disabled={running}
        className="mt-3 min-h-11 w-full rounded-xl bg-stone-800 font-bold text-white disabled:opacity-50"
      >
        {running ? `測定中…（${results.length}/${DIAG_STEPS.length}）` : '診断を開始'}
      </button>
      {(results.length > 0 || info) && (
        <>
          <pre className="mt-3 whitespace-pre-wrap break-all rounded-xl bg-stone-100 p-3 text-xs leading-relaxed">
            {report}
          </pre>
          {!running && (
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(report)}
              className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 font-medium text-stone-700 active:bg-stone-100"
            >
              結果をコピー
            </button>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-stone-400">アプリ版: {__APP_VERSION__}</p>
    </details>
  )
}
