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

export async function speak(text: string, opts: { slow?: boolean } = {}): Promise<void> {
  if (!isSupported()) return
  const voice = await loadChineseVoice()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  if (voice) u.voice = voice
  u.rate = opts.slow ? 0.6 : 0.85
  speechSynthesis.speak(u)
}

export const ttsSupported = isSupported
