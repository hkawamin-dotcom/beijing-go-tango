import type { Word } from '../types'
import hsk1 from './hsk1.json'

export const words: Word[] = hsk1 as Word[]
export const wordById = new Map(words.map((w) => [w.id, w]))
