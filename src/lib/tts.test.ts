import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NORMAL_RATE, SLOW_LEVELS, rateFor, speak } from './tts'

// 実機（iPhone・WebKit）での測定結果（2026-11-16）：
//   音声を名指し → 速さ1.0: 3.35秒 / 0.5: 3.57秒（速さが無視される）
//   言語だけ指定 → 速さ1.0: 2.71秒 / 0.5: 3.50秒（速さが効く）
describe('読み上げの速さ', () => {
  it('普通の再生は端末標準の速さ（1.0）', () => {
    expect(NORMAL_RATE).toBe(1)
    expect(rateFor({ slow: false }, 'medium')).toBe(1)
  })

  it('ゆっくりは段階に応じて遅くなり、どれも普通より遅い', () => {
    const mild = rateFor({ slow: true }, 'mild')
    const medium = rateFor({ slow: true }, 'medium')
    const strong = rateFor({ slow: true }, 'strong')
    expect(mild).toBeLessThan(NORMAL_RATE)
    expect(medium).toBeLessThan(mild)
    expect(strong).toBeLessThan(medium)
  })

  it('既定の「ゆっくり」は、実機で遅くなると確認できた 0.5', () => {
    expect(rateFor({ slow: true }, 'medium')).toBe(0.5)
  })

  it('段階の速さは Web Speech API の下限 0.1 より大きい', () => {
    for (const { rate } of Object.values(SLOW_LEVELS)) expect(rate).toBeGreaterThan(0.1)
  })
})

describe('speak', () => {
  const spoken: SpeechSynthesisUtterance[] = []

  beforeEach(() => {
    spoken.length = 0
    class FakeUtterance {
      text: string
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      constructor(text: string) {
        this.text = text
      }
    }
    const zhVoice = { name: 'Ting-Ting', lang: 'zh-CN', localService: true } as SpeechSynthesisVoice
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [zhVoice],
      cancel: vi.fn(),
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('音声を名指しせず、言語（zh-CN）だけ指定する（名指しすると iPhone で速さが無視されるため）', async () => {
    await speak('你好')
    expect(spoken).toHaveLength(1)
    expect(spoken[0].voice).toBeNull()
    expect(spoken[0].lang).toBe('zh-CN')
  })

  it('ゆっくりでは選んだ段階の速さで読む', async () => {
    await speak('你好', { slow: true, level: 'strong' })
    expect(spoken[0].rate).toBe(SLOW_LEVELS.strong.rate)
  })
})
