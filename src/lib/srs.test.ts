import { describe, expect, it } from 'vitest'
import { buildQueue, review, startOfDay, summarize, newCardsLeft, MAX_BOX } from './srs'
import type { Progress, Word } from '../types'

const NOW = new Date(2026, 10, 16, 20, 0).getTime() // 2026-11-16 20:00
const day = (n: number) => {
  const d = new Date(startOfDay(NOW))
  d.setDate(d.getDate() + n)
  return d.getTime()
}

const word = (id: string): Word => ({
  id,
  hanzi: id,
  pinyin: 'x',
  pinyinNum: 'x1',
  pos: '名詞',
  ja: 'x',
  hsk: 1,
  example: { zh: id, pinyin: 'x', ja: 'x' },
})

describe('review', () => {
  it('初めての単語で「覚えた」→ 箱1、翌日に出る', () => {
    const p = review(undefined, '你', 'know', NOW)
    expect(p.box).toBe(1)
    expect(p.due).toBe(day(1))
    expect(p.firstSeen).toBe(NOW)
    expect(p.reviews).toBe(1)
  })

  it('「覚えた」を続けると間隔が 1→3→7 日と延びる', () => {
    let p = review(undefined, '你', 'know', NOW)
    p = review(p, '你', 'know', day(1))
    expect(p.box).toBe(2)
    expect(p.due).toBe(day(1 + 3))
    p = review(p, '你', 'know', day(4))
    expect(p.box).toBe(3)
    expect(p.due).toBe(day(4 + 7))
  })

  it('「まだ」で箱0に戻り、すぐ出題対象になる。覚えていた語を忘れたら忘れた回数が増える', () => {
    let p = review(undefined, '你', 'know', NOW)
    p = review(p, '你', 'again', day(1))
    expect(p.box).toBe(0)
    expect(p.due).toBe(day(1))
    expect(p.lapses).toBe(1)
  })

  it('初めての単語で「まだ」は忘れた回数に数えない', () => {
    const p = review(undefined, '你', 'again', NOW)
    expect(p.lapses).toBe(0)
  })

  it('箱は最大値より大きくならない', () => {
    let p: Progress | undefined
    for (let i = 0; i < 20; i++) p = review(p, '你', 'know', NOW)
    expect(p!.box).toBe(MAX_BOX)
  })

  it('元の記録を書き換えない', () => {
    const p = review(undefined, '你', 'know', NOW)
    const copy = { ...p }
    review(p, '你', 'again', NOW)
    expect(p).toEqual(copy)
  })
})

describe('buildQueue', () => {
  const words = ['a', 'b', 'c', 'd', 'e'].map(word)

  it('記録がなければ新しい単語を1日の上限まで出す', () => {
    const q = buildQueue(words, new Map(), NOW, 3)
    expect(q.map((w) => w.id)).toEqual(['a', 'b', 'c'])
  })

  it('期限が来た復習を先に、期限の古い順に出し、未来の復習は出さない', () => {
    const progress = new Map<string, Progress>([
      ['a', { ...review(undefined, 'a', 'know', day(-5)), due: day(0) }],
      ['b', { ...review(undefined, 'b', 'know', day(-5)), due: day(-2) }],
      ['c', { ...review(undefined, 'c', 'know', day(-5)), due: day(3) }],
    ])
    const q = buildQueue(words, progress, NOW, 1)
    expect(q.map((w) => w.id)).toEqual(['b', 'a', 'd'])
  })

  it('今日すでに始めた新しい単語は上限から差し引く', () => {
    const progress = new Map<string, Progress>([['a', review(undefined, 'a', 'know', NOW)]])
    expect(newCardsLeft(progress, NOW, 3)).toBe(2)
    expect(buildQueue(words, progress, NOW, 3).map((w) => w.id)).toEqual(['b', 'c'])
  })
})

describe('summarize', () => {
  it('未学習・学習中・覚えた を数える', () => {
    const words = ['a', 'b', 'c'].map(word)
    const progress = new Map<string, Progress>([
      ['a', { ...review(undefined, 'a', 'know', NOW), box: 1 }],
      ['b', { ...review(undefined, 'b', 'know', NOW), box: 3 }],
    ])
    expect(summarize(words, progress)).toEqual({ new: 1, learning: 1, learned: 1, total: 3 })
  })
})
