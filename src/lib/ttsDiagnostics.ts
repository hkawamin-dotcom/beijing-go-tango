// 実機で「速さの指定が読み上げ時間に効いているか」を測るための診断。
// 同じ文を、音声の指定あり／なし × 速さ 1.0／0.5 で読み、開始〜終了の時間を測る。
// 速さ 0.5 が効いていれば、1.0 のおよそ 1.5〜2 倍の時間になるはず。
import { loadChineseVoice } from './tts'

export const DIAG_TEXT = '你好，我是你的汉语老师。'

export interface DiagStep {
  label: string
  useVoice: boolean
  rate: number
}

/** 2回目の「指定あり 0.5」は、最初の1回だけ効く不具合（WebKit 282920）を見分けるため */
export const DIAG_STEPS: DiagStep[] = [
  { label: '音声指定あり・速さ1.0', useVoice: true, rate: 1 },
  { label: '音声指定あり・速さ0.5', useVoice: true, rate: 0.5 },
  { label: '音声指定あり・速さ0.5（2回目）', useVoice: true, rate: 0.5 },
  { label: '音声指定なし・速さ1.0', useVoice: false, rate: 1 },
  { label: '音声指定なし・速さ0.5', useVoice: false, rate: 0.5 },
]

export interface DiagResult {
  label: string
  ms: number | null
  note?: string
}

function measure(step: DiagStep, voice: SpeechSynthesisVoice | null): Promise<DiagResult> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(DIAG_TEXT)
    u.lang = 'zh-CN'
    if (step.useVoice && voice) u.voice = voice
    u.rate = step.rate
    let start = 0
    const timer = setTimeout(() => resolve({ label: step.label, ms: null, note: '時間切れ' }), 20000)
    u.onstart = () => {
      start = performance.now()
    }
    u.onend = () => {
      clearTimeout(timer)
      resolve({ label: step.label, ms: start ? Math.round(performance.now() - start) : null })
    }
    u.onerror = (e) => {
      clearTimeout(timer)
      resolve({ label: step.label, ms: null, note: `エラー: ${e.error}` })
    }
    speechSynthesis.speak(u)
  })
}

export async function runDiagnostics(onProgress: (results: DiagResult[]) => void): Promise<DiagResult[]> {
  const voice = await loadChineseVoice()
  speechSynthesis.cancel()
  const results: DiagResult[] = []
  for (const step of DIAG_STEPS) {
    results.push(await measure(step, voice))
    onProgress([...results])
    await new Promise((r) => setTimeout(r, 400))
  }
  return results
}

export async function voiceInfo(): Promise<string> {
  const v = await loadChineseVoice()
  const all = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : []
  const zh = all.filter((x) => x.lang.toLowerCase().replace('_', '-').startsWith('zh'))
  return [
    `使用中の音声: ${v ? `${v.name}（${v.lang}・${v.localService ? '端末内' : 'オンライン'}）` : 'なし'}`,
    `中国語の音声: ${zh.map((x) => `${x.name}(${x.lang})`).join(', ') || 'なし'}`,
    `ブラウザ: ${navigator.userAgent}`,
  ].join('\n')
}
