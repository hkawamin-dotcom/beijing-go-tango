// 実機で「速さの指定が読み上げ時間に効いているか」を測るための診断。
// 同じ文を速さを変えて読み、開始〜終了の時間を測る。
import { loadChineseVoice } from './tts'

export const DIAG_TEXT = '你好，我是你的汉语老师。'

export interface DiagStep {
  label: string
  useVoice: boolean
  rate: number
}

// 1回目の測定（2026-11-16, iPhone）で「音声を名指しすると速さが無視される」と判明したため、
// いまはアプリと同じ「言語だけ指定」の条件で、普通と「ゆっくり」3段階を測る
export const DIAG_STEPS: DiagStep[] = [
  { label: '普通（速さ1.0）', useVoice: false, rate: 1 },
  { label: '少しゆっくり（0.65）', useVoice: false, rate: 0.65 },
  { label: 'ゆっくり（0.5）', useVoice: false, rate: 0.5 },
  { label: 'とてもゆっくり（0.35）', useVoice: false, rate: 0.35 },
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
    `中国本土の音声（アプリは名指しせず端末に任せる）: ${v ?`${v.name}（${v.lang}・${v.localService ? '端末内' : 'オンライン'}）` : 'なし'}`,
    `中国語の音声: ${zh.map((x) => `${x.name}(${x.lang})`).join(', ') || 'なし'}`,
    `ブラウザ: ${navigator.userAgent}`,
  ].join('\n')
}
