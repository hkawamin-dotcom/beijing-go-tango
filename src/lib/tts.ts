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

// 速さについて：
// iPhone の Safari は「指定した速さ × iPhone 標準の速さ」で読み上げる。
// 1.0 未満では音声を引き伸ばすため、0.6 まで下げると音が伸びて歪んだ（実機で確認）。
// そのため普通は 1.0（引き伸ばしなし）、ゆっくりも 0.65 より下げない。
export const NORMAL_RATE = 1

export const SLOW_LEVELS = {
  mild: { rate: 0.85, label: '少しゆっくり' },
  medium: { rate: 0.75, label: 'ゆっくり' },
  strong: { rate: 0.65, label: 'とてもゆっくり' },
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
  const voice = await loadChineseVoice()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  if (voice) u.voice = voice
  u.rate = rateFor(opts, opts.level ?? slowLevel)
  speechSynthesis.speak(u)
}

export const ttsSupported = isSupported
