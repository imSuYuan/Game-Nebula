import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AddGameModal from './components/AddGameModal'
import GlobalBackground from './components/GlobalBackground'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import Toast from './components/Toast'
import GameDetail from './pages/GameDetail'
import Library from './pages/Library'
import SettingsPage from './pages/Settings'
import { useGameStore } from './store/useGameStore'
import { useSettingsStore } from './store/useSettingsStore'
import { useUIStore } from './store/useUIStore'
import type { PlaySession } from './types/game'

function App() {
  const location = useLocation()
  const games = useGameStore((state) => state.games)
  const hydrateGames = useGameStore((state) => state.hydrate)
  const updateGame = useGameStore((state) => state.updateGame)
  const hydrateSettings = useSettingsStore((state) => state.hydrate)
  const accentColor = useSettingsStore((state) => state.settings.accentColor)
  const selectedGameId = useUIStore((state) => state.selectedGameId)
  const setSelectedGameId = useUIStore((state) => state.setSelectedGameId)
  const isAddGameModalOpen = useUIStore((state) => state.isAddGameModalOpen)
  const setAddGameModalOpen = useUIStore((state) => state.setAddGameModalOpen)
  const pushToast = useUIStore((state) => state.pushToast)

  useEffect(() => {
    void hydrateGames()
    void hydrateSettings()
  }, [hydrateGames, hydrateSettings])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    if (!games.length) {
      return
    }

    if (!selectedGameId || !games.some((game) => game.id === selectedGameId)) {
      setSelectedGameId(games[0].id)
    }
  }, [games, selectedGameId, setSelectedGameId])

  useEffect(() => {
    const offLaunched = window.launcher?.events.onGameLaunched(({ gameId }) => {
      void updateGame(gameId, (game) => ({ ...game, isRunning: true }))
    })

    const offSessionEnded = window.launcher?.events.onGameSessionEnded(({ gameId, session }) => {
      let gameName = ''

      void updateGame(gameId, (game) => {
        gameName = game.name
        const nextSession: PlaySession = {
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
        }

        return {
          ...game,
          isRunning: false,
          sessions: [nextSession, ...game.sessions],
          totalPlayTime: game.totalPlayTime + session.duration,
          lastPlayed: session.endTime,
        }
      }).then(() => {
        if (gameName) {
          pushToast({
            id: `${gameId}-${session.endTime}`,
            type: 'success',
            message: `《${gameName}》已退出 · 本次 ${session.duration}分钟`,
          })
        }
      })
    })

    const offLaunchError = window.launcher?.events.onGameLaunchError(({ gameId }) => {
      void updateGame(gameId, (game) => ({ ...game, isRunning: false }))
      pushToast({
        id: `${gameId}-launch-error-${Date.now()}`,
        type: 'error',
        message: '启动失败，请检查路径是否正确',
      })
    })

    return () => {
      offLaunched?.()
      offSessionEnded?.()
      offLaunchError?.()
    }
  }, [pushToast, updateGame])

  const detailRouteMatch = location.pathname.match(/^\/game\/([^/]+)/)
  const isDetailRoute = Boolean(detailRouteMatch)
  const selectedBackground = null
  const immersiveRoute =
    location.pathname.startsWith('/library') ||
    location.pathname.startsWith('/favorites') ||
    location.pathname.startsWith('/recent') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/game/')

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <GlobalBackground imagePath={selectedBackground} />
      <TitleBar />
      <div className="relative z-10 flex h-[calc(100%-2rem)]">
        {immersiveRoute ? null : <Sidebar />}
        <main className="relative flex-1 overflow-hidden">
          {isDetailRoute ? (
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/library" replace />} />
                  <Route path="/library" element={<Library mode="library" />} />
                  <Route path="/favorites" element={<Library mode="favorites" />} />
                  <Route path="/recent" element={<Library mode="recent" />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/game/:id" element={<GameDetail />} />
                  <Route path="*" element={<Navigate to="/library" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/library" replace />} />
                  <Route path="/library" element={<Library mode="library" />} />
                  <Route path="/favorites" element={<Library mode="favorites" />} />
                  <Route path="/recent" element={<Library mode="recent" />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/game/:id" element={<GameDetail />} />
                  <Route path="*" element={<Navigate to="/library" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
      <AddGameModal open={isAddGameModalOpen} onClose={() => setAddGameModalOpen(false)} />
      <Toast />
    </div>
  )
}

export default App
