// 学習記録を端末内（IndexedDB）に保存する
import Dexie, { type EntityTable } from 'dexie'
import type { Progress } from '../types'
import { DEFAULT_NEW_PER_DAY } from './srs'
import { SLOW_LEVELS, type SlowLevel } from './tts'

interface Setting {
  key: string
  value: unknown
}

export const db = new Dexie('beijing-go-gakushu') as Dexie & {
  progress: EntityTable<Progress, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  progress: 'id, due, box',
  settings: 'key',
})

export async function loadProgress(): Promise<Map<string, Progress>> {
  const all = await db.progress.toArray()
  return new Map(all.map((p) => [p.id, p]))
}

export async function saveProgress(p: Progress): Promise<void> {
  await db.progress.put(p)
}

export async function resetProgress(): Promise<void> {
  await db.progress.clear()
}

export interface Settings {
  /** 1日に出す新しい単語の数 */
  newPerDay: number
  /** 答えを開いたとき自動で読み上げる */
  autoSpeak: boolean
  /** 「ゆっくり」ボタンの遅さ */
  slowLevel: SlowLevel
}

export const DEFAULT_SETTINGS: Settings = { newPerDay: DEFAULT_NEW_PER_DAY, autoSpeak: true, slowLevel: 'medium' }

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    newPerDay: typeof saved.newPerDay === 'number' ? saved.newPerDay : DEFAULT_SETTINGS.newPerDay,
    autoSpeak: typeof saved.autoSpeak === 'boolean' ? saved.autoSpeak : DEFAULT_SETTINGS.autoSpeak,
    slowLevel:
      typeof saved.slowLevel === 'string' && saved.slowLevel in SLOW_LEVELS
        ? (saved.slowLevel as SlowLevel)
        : DEFAULT_SETTINGS.slowLevel,
  }
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value })
}

/** ブラウザに「容量が足りなくても消さないで」と頼む（対応ブラウザのみ） */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // 非対応でも学習には影響しない
  }
}
