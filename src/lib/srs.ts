// 間隔反復（ライトナー方式）
// 「覚えた」を押すたびに箱が1つ進み、次の復習までの日数が延びる。
// 「まだ」を押すと箱0に戻り、同じ学習の中でもう一度出る。
import type { Answer, Progress, Word } from '../types'

/** 箱ごとの次回復習までの日数（箱0は当日中にもう一度） */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60] as const
export const MAX_BOX = INTERVAL_DAYS.length - 1
/** この箱以上を「覚えた」と数える（1週間以上あけても覚えていた） */
export const LEARNED_BOX = 3
export const DEFAULT_NEW_PER_DAY = 10

/** その日の0時（端末のタイムゾーン） */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** n日後の0時。夏時間でもずれないよう日付で計算する */
function addDays(dayStart: number, n: number): number {
  const d = new Date(dayStart)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** 回答を反映した新しい学習記録を返す（元の記録は変更しない） */
export function review(prev: Progress | undefined, id: string, answer: Answer, now: number): Progress {
  const base: Progress = prev ?? {
    id,
    box: 0,
    due: now,
    reviews: 0,
    lapses: 0,
    firstSeen: now,
    lastReviewed: now,
  }
  if (answer === 'again') {
    return {
      ...base,
      box: 0,
      due: now,
      reviews: base.reviews + 1,
      lapses: base.lapses + (base.box > 0 ? 1 : 0),
      lastReviewed: now,
    }
  }
  const box = Math.min(base.box + 1, MAX_BOX)
  return {
    ...base,
    box,
    due: addDays(startOfDay(now), INTERVAL_DAYS[box]),
    reviews: base.reviews + 1,
    lastReviewed: now,
  }
}

/** 今日の新しい単語の残り枠 */
export function newCardsLeft(progress: Map<string, Progress>, now: number, newPerDay: number): number {
  const today = startOfDay(now)
  let introduced = 0
  for (const p of progress.values()) if (p.firstSeen >= today) introduced++
  return Math.max(0, newPerDay - introduced)
}

/**
 * 今日の出題リストを作る。
 * 1. 復習日が今日までの単語（期限の古い順）
 * 2. まだ一度も出していない単語（データの順、1日の上限まで）
 */
export function buildQueue(
  words: Word[],
  progress: Map<string, Progress>,
  now: number,
  newPerDay = DEFAULT_NEW_PER_DAY,
): Word[] {
  const endOfToday = addDays(startOfDay(now), 1)
  const due = words
    .filter((w) => {
      const p = progress.get(w.id)
      return p !== undefined && p.due < endOfToday
    })
    .sort((a, b) => progress.get(a.id)!.due - progress.get(b.id)!.due)
  const fresh = words.filter((w) => !progress.has(w.id)).slice(0, newCardsLeft(progress, now, newPerDay))
  return [...due, ...fresh]
}

export type WordStatus = 'new' | 'learning' | 'learned'

export function statusOf(p: Progress | undefined): WordStatus {
  if (!p) return 'new'
  return p.box >= LEARNED_BOX ? 'learned' : 'learning'
}

export function summarize(words: Word[], progress: Map<string, Progress>) {
  const counts = { new: 0, learning: 0, learned: 0 }
  for (const w of words) counts[statusOf(progress.get(w.id))]++
  return { ...counts, total: words.length }
}
