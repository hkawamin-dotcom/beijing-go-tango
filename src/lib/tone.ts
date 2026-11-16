import type { Word } from '../types'

export type Tone = 0 | 1 | 2 | 3 | 4

/** 漢字1文字ずつに声調（1〜4、軽声は0）を割り当てる。儿化の「儿」は直前の字と同じ声調にする */
export function toneOfChars(word: Pick<Word, 'hanzi' | 'pinyinNum'>): { char: string; tone: Tone }[] {
  const chars = [...word.hanzi]
  const tones = word.pinyinNum.split(' ').map((s) => Number(s.at(-1)) as Tone)
  return chars.map((char, i) => ({ char, tone: tones[Math.min(i, tones.length - 1)] ?? 0 }))
}

/** ピンインの声調記号を外して比較しやすくする（nǐ hǎo → nihao） */
export function stripTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s']/g, '')
    .toLowerCase()
}

export const TONE_LABEL: Record<Tone, string> = { 1: '1声', 2: '2声', 3: '3声', 4: '4声', 0: '軽声' }
export const TONE_CLASS: Record<Tone, string> = {
  1: 'text-tone-1',
  2: 'text-tone-2',
  3: 'text-tone-3',
  4: 'text-tone-4',
  0: 'text-tone-0',
}
