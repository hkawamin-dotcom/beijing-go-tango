import { describe, expect, it } from 'vitest'
import { NORMAL_RATE, SLOW_LEVELS, rateFor } from './tts'

// iPhone の Safari は「指定した速さ × iPhone 標準の速さ」で読む。
// 1.0 未満にすると音が引き伸ばされ、下げすぎると歪む。
describe('読み上げの速さ', () => {
  it('普通の再生は端末標準の速さ（1.0）で、引き伸ばしをしない', () => {
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

  it('一番遅い段階でも、歪みが出た 0.6 より速い', () => {
    for (const level of Object.keys(SLOW_LEVELS) as (keyof typeof SLOW_LEVELS)[]) {
      expect(rateFor({ slow: true }, level)).toBeGreaterThan(0.6)
    }
  })

  it('既定の「ゆっくり」は 0.75', () => {
    expect(rateFor({ slow: true }, 'medium')).toBe(0.75)
  })
})
