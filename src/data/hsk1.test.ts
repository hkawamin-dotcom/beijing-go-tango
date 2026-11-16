import { describe, expect, it } from 'vitest'
import { words } from './index'

describe('HSK1 単語データ', () => {
  it('150語以上ある', () => {
    expect(words.length).toBeGreaterThanOrEqual(150)
  })

  it('id が重複していない', () => {
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length)
  })

  it('すべての語に必須項目がある', () => {
    for (const w of words) {
      expect(w.hanzi, w.id).not.toBe('')
      expect(w.pinyin, w.id).not.toBe('')
      expect(w.ja, w.id).not.toBe('')
      expect(w.example.zh, w.id).not.toBe('')
      expect(w.example.pinyin, w.id).not.toBe('')
      expect(w.example.ja, w.id).not.toBe('')
    }
  })

  it('例文にその単語が含まれている', () => {
    const missing = words.filter((w) => !w.example.zh.includes(w.hanzi)).map((w) => w.id)
    expect(missing).toEqual([])
  })

  it('数字ピンインの音節数が漢字の数と合う（儿化は1音節にまとめる）', () => {
    for (const w of words) {
      const chars = [...w.hanzi].length
      const syllables = w.pinyinNum.split(' ')
      // 儿化：最後の「儿」が独立した音節（er2）ではなく、前の音節に r として付いている
      const erhua = w.hanzi.endsWith('儿') && !/^er\d$/.test(syllables.at(-1)!) ? 1 : 0
      expect(syllables.length, w.id).toBe(chars - erhua)
    }
  })

  it('日本の字形が簡体字と同じなら書かない', () => {
    const same = words.filter((w) => w.jaForm === w.hanzi).map((w) => w.id)
    expect(same).toEqual([])
  })
})
