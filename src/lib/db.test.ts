import { beforeEach, describe, expect, it } from 'vitest'
import { db, DEFAULT_SETTINGS, loadProgress, loadSettings, resetProgress, saveProgress, saveSetting } from './db'
import { review } from './srs'

beforeEach(async () => {
  await db.progress.clear()
  await db.settings.clear()
})

describe('学習記録の保存', () => {
  it('保存した記録を読み込める', async () => {
    const p = review(undefined, '你', 'know', Date.now())
    await saveProgress(p)
    const loaded = await loadProgress()
    expect(loaded.get('你')).toEqual(p)
  })

  it('同じ単語は上書きされる', async () => {
    const now = Date.now()
    const p1 = review(undefined, '你', 'know', now)
    await saveProgress(p1)
    await saveProgress(review(p1, '你', 'again', now))
    const loaded = await loadProgress()
    expect(loaded.size).toBe(1)
    expect(loaded.get('你')!.box).toBe(0)
  })

  it('リセットで全記録が消える', async () => {
    await saveProgress(review(undefined, '你', 'know', Date.now()))
    await resetProgress()
    expect((await loadProgress()).size).toBe(0)
  })

  it('設定：未設定なら既定値、保存すればその値', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
    await saveSetting('newPerDay', 20)
    await saveSetting('autoSpeak', false)
    await saveSetting('slowLevel', 'strong')
    expect(await loadSettings()).toEqual({ newPerDay: 20, autoSpeak: false, slowLevel: 'strong' })
  })

  it('設定：保存された「ゆっくり」の段階が不正な値なら既定値に戻す', async () => {
    await db.settings.put({ key: 'slowLevel', value: 'superslow' })
    expect((await loadSettings()).slowLevel).toBe(DEFAULT_SETTINGS.slowLevel)
  })
})
