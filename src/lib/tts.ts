// ブラウザ内蔵の音声合成（Web Speech API）で中国語を読み上げる
// 中国本土の音声（zh-CN）を優先し、無ければ他の中国語音声を使う

let cachedVoice: SpeechSynthesisVoice | null | undefined

const isSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase()
  return (
    voices.find((v) => norm(v) === 'zh-cn') ??
    voices.find((v) => norm(v).startsWith('zh-hans')) ??
    voices.find((v) => norm(v).startsWith('cmn')) ??
    voices.find((v) => norm(v).startsWith('zh') && !norm(v).includes('hk')) ??
    null
  )
}

/** 音声の一覧は非同期で読み込まれるため、少し待ってから取得する */
export function loadChineseVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!isSupported()) return Promise.resolve(null)
  if (cachedVoice !== undefined) return Promise.resolve(cachedVoice)
  return new Promise((resolve) => {
    const done = () => {
      const voices = speechSynthesis.getVoices()
      if (!voices.length) return false
      cachedVoice = pickVoice(voices)
      resolve(cachedVoice)
      return true
    }
    if (done()) return
    const onChange = () => {
      if (done()) speechSynthesis.removeEventListener('voiceschanged', onChange)
    }
    speechSynthesis.addEventListener('voiceschanged', onChange)
    // 一覧が届かない端末もあるので2秒で打ち切る
    setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', onChange)
      if (cachedVoice === undefined) {
        cachedVoice = pickVoice(speechSynthesis.getVoices())
        resolve(cachedVoice)
      }
    }, 2000)
  })
}

// 速さについて（iPhone 実機・WebKit での測定、2026-11-16）：
//   音声を名指し（u.voice を設定）→ 速さ1.0: 3.35秒 / 0.5: 3.57秒 … 速さが無視される
//   言語だけ指定（u.lang のみ）  → 速さ1.0: 2.71秒 / 0.5: 3.50秒 … 速さが効く
// そのため音声は名指しせず、言語 zh-CN だけ指定する（端末が中国語の既定音声を選ぶ）。
// また 0.5 でも約1.3倍しか遅くならないため、ゆっくりの段階は大きめに下げている。
export const NORMAL_RATE = 1

export const SLOW_LEVELS = {
  mild: { rate: 0.65, label: '少しゆっくり' },
  medium: { rate: 0.5, label: 'ゆっくり' },
  strong: { rate: 0.35, label: 'とてもゆっくり' },
} as const

export type SlowLevel = keyof typeof SLOW_LEVELS

export function rateFor(opts: { slow?: boolean }, level: SlowLevel): number {
  return opts.slow ? SLOW_LEVELS[level].rate : NORMAL_RATE
}

let slowLevel: SlowLevel = 'medium'

/** 設定画面で選んだ「ゆっくり」の段階を反映する */
export function setSlowLevel(level: SlowLevel): void {
  slowLevel = level
}

export async function speak(text: string, opts: { slow?: boolean; level?: SlowLevel } = {}): Promise<void> {
  if (!isSupported()) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  // 音声は名指ししない（名指しすると iPhone で速さが無視される）。言語だけ指定する
  u.lang = 'zh-CN'
  u.rate = rateFor(opts, opts.level ?? slowLevel)
  speechSynthesis.speak(u)
}

export const ttsSupported = isSupported
