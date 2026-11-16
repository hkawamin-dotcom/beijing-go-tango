import { describe, expect, it } from 'vitest'
import { stripTones, toneOfChars } from './tone'

describe('toneOfChars', () => {
  it('1字ずつ声調を割り当てる（軽声は0）', () => {
    expect(toneOfChars({ hanzi: '谢谢', pinyinNum: 'xie4 xie0' })).toEqual([
      { char: '谢', tone: 4 },
      { char: '谢', tone: 0 },
    ])
  })

  it('儿化の「儿」は直前の字と同じ声調', () => {
    expect(toneOfChars({ hanzi: '哪儿', pinyinNum: 'nar3' }).map((c) => c.tone)).toEqual([3, 3])
  })
})

describe('stripTones', () => {
  it('声調記号・空白・アポストロフィを外す', () => {
    expect(stripTones('Nǐ hǎo')).toBe('nihao')
    expect(stripTones("nǚ'ér")).toBe('nuer')
  })
})
