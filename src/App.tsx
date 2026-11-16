import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Answer, Progress, Word } from './types'
import { words } from './data'
import { buildQueue, review } from './lib/srs'
import {
  DEFAULT_SETTINGS,
  loadProgress,
  loadSettings,
  requestPersistentStorage,
  resetProgress,
  saveProgress,
  saveSetting,
  type Settings,
} from './lib/db'
import { setSlowLevel } from './lib/tts'
import { Home } from './components/Home'
import { Study } from './components/Study'
import { WordList } from './components/WordList'
import { SettingsScreen } from './components/SettingsScreen'

type Screen = 'home' | 'study' | 'list' | 'settings'
const EXTRA_NEW = 10

export default function App() {
  const [progress, setProgress] = useState<Map<string, Progress> | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [screen, setScreen] = useState<Screen>('home')
  const [session, setSession] = useState<Word[]>([])
  const [now, setNow] = useState(() => Date.now())
  const progressRef = useRef<Map<string, Progress>>(new Map())

  useEffect(() => {
    void Promise.all([loadProgress(), loadSettings()]).then(([p, s]) => {
      progressRef.current = p
      setProgress(p)
      setSettings(s)
      setSlowLevel(s.slowLevel)
    })
    void requestPersistentStorage()
  }, [])

  // Android の戻るボタン・ブラウザの戻るでホームへ
  useEffect(() => {
    const onPop = () => {
      setScreen('home')
      setNow(Date.now())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((s: Screen) => {
    if (s === 'home') {
      if (history.state?.screen) history.back()
      else setScreen('home')
      setNow(Date.now())
      return
    }
    history.pushState({ screen: s }, '')
    setScreen(s)
  }, [])

  const queue = useMemo(
    () => (progress ? buildQueue(words, progress, now, settings.newPerDay) : []),
    [progress, now, settings.newPerDay],
  )
  const dueCount = queue.filter((w) => progress?.has(w.id)).length

  const answer = useCallback((word: Word, a: Answer) => {
    const next = review(progressRef.current.get(word.id), word.id, a, Date.now())
    progressRef.current = new Map(progressRef.current).set(word.id, next)
    setProgress(progressRef.current)
    void saveProgress(next)
  }, [])

  const changeSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
    if (key === 'slowLevel') setSlowLevel(value as Settings['slowLevel'])
    void saveSetting(key, value)
  }, [])

  if (!progress) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-500">読み込み中…</div>
  }

  switch (screen) {
    case 'study':
      return <Study initial={session} autoSpeak={settings.autoSpeak} onAnswer={answer} onExit={() => go('home')} />
    case 'list':
      return <WordList words={words} progress={progress} onBack={() => go('home')} />
    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          onChange={changeSetting}
          onReset={() => {
            void resetProgress().then(() => {
              progressRef.current = new Map()
              setProgress(progressRef.current)
            })
          }}
          onBack={() => go('home')}
        />
      )
    default:
      return (
        <Home
          words={words}
          progress={progress}
          dueCount={dueCount}
          newCount={queue.length - dueCount}
          onStart={() => {
            setSession(queue)
            go('study')
          }}
          onExtra={() => {
            setSession(words.filter((w) => !progress.has(w.id)).slice(0, EXTRA_NEW))
            go('study')
          }}
          onList={() => go('list')}
          onSettings={() => go('settings')}
        />
      )
  }
}
