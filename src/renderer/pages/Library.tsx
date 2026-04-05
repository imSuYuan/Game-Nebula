import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import EditGameModal from '../components/EditGameModal'
import GameContextMenu from '../components/GameContextMenu'
import HeroSection from '../components/HeroSection'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import type { Game } from '../types/game'
import type { Settings } from '../types/settings'

interface LibraryProps {
  mode: 'library' | 'favorites' | 'recent'
}

const RECORD_MENU_WIDTH = 240

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`
}

function sortGames(games: Game[], sortBy: Settings['defaultSortBy']): Game[] {
  const list = [...games]

  list.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }

    if (sortBy === 'totalPlayTime') {
      return b.totalPlayTime - a.totalPlayTime
    }

    const aTime = a[sortBy] ? new Date(a[sortBy] as string).getTime() : 0
    const bTime = b[sortBy] ? new Date(b[sortBy] as string).getTime() : 0
    return bTime - aTime
  })

  return list
}

function Library({ mode }: LibraryProps) {
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)
  const updateGame = useGameStore((state) => state.updateGame)
  const removeGame = useGameStore((state) => state.removeGame)
  const selectedGameId = useUIStore((state) => state.selectedGameId)
  const setSelectedGameId = useUIStore((state) => state.setSelectedGameId)
  const pushToast = useUIStore((state) => state.pushToast)
  const setAddGameModalOpen = useUIStore((state) => state.setAddGameModalOpen)

  const settings = useSettingsStore((state) => state.settings)

  const [sortBy, setSortBy] = useState<Settings['defaultSortBy']>(settings.defaultSortBy)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; gameId: string } | null>(null)
  const [recordMenuOpen, setRecordMenuOpen] = useState(false)

  const dataSource = games

  const modeFiltered = useMemo(() => {
    if (mode === 'favorites') {
      return dataSource.filter((game) => game.isFavorite)
    }

    if (mode === 'recent') {
      return dataSource
        .filter((game) => game.totalPlayTime > 0 || game.sessions.length > 0 || Boolean(game.lastPlayed))
        .sort((a, b) => new Date(b.lastPlayed ?? 0).getTime() - new Date(a.lastPlayed ?? 0).getTime())
    }

    return dataSource
  }, [dataSource, mode])

  const finalGames = useMemo(() => {
    return sortGames(modeFiltered, sortBy)
  }, [modeFiltered, sortBy])

  const selectedGame = finalGames.find((game) => game.id === selectedGameId) ?? finalGames[0] ?? null
  const contextGame = contextMenu ? dataSource.find((game) => game.id === contextMenu.gameId) ?? null : null
  const editingGame = editingGameId ? dataSource.find((game) => game.id === editingGameId) ?? null : null
  const deleteGame = deleteGameId ? dataSource.find((game) => game.id === deleteGameId) ?? null : null

  useEffect(() => {
    if (mode === 'recent') {
      return
    }

    if (!selectedGame) {
      return
    }

    if (selectedGame.id !== selectedGameId) {
      setSelectedGameId(selectedGame.id)
    }
  }, [mode, selectedGame, selectedGameId, setSelectedGameId])

  useEffect(() => {
    setSortBy(settings.defaultSortBy)
  }, [settings.defaultSortBy])

  useEffect(() => {
    setContextMenu(null)
  }, [mode, sortBy])

  const handleToggleFavorite = async (gameId: string) => {
    await updateGame(gameId, (game) => ({
      ...game,
      isFavorite: !game.isFavorite,
    }))
  }

  const handleLaunch = async (gameId: string) => {
    setSelectedGameId(gameId)

    const game = dataSource.find((item) => item.id === gameId)
    if (!game) {
      return
    }

    const result = await window.launcher?.game.launch({ gameId, exePath: game.exePath })
    if (!result?.success) {
      pushToast({
        id: `${gameId}-launch-failed-${Date.now()}`,
        type: 'error',
        message: result?.error || '启动失败，请检查路径是否正确',
      })
    }
  }

  const openContextMenu = (event: React.MouseEvent, gameId: string) => {
    event.preventDefault()
    setSelectedGameId(gameId)
    setContextMenu({ x: event.clientX, y: event.clientY, gameId })
  }

  const handleDelete = async () => {
    if (!deleteGame) {
      return
    }

    await removeGame(deleteGame.id)
    pushToast({ id: `${deleteGame.id}-delete-${Date.now()}`, type: 'info', message: `已删除《${deleteGame.name}》` })

    setDeleteGameId(null)
  }

  const contextActions = contextGame
    ? [
        {
          key: 'launch',
          label: '▶ 开始游戏',
          onClick: () => void handleLaunch(contextGame.id),
        },
        {
          key: 'edit',
          label: '✏️ 编辑信息',
          onClick: () => setEditingGameId(contextGame.id),
        },
        {
          key: 'favorite',
          label: contextGame.isFavorite ? '⭐ 取消收藏' : '⭐ 收藏',
          onClick: () => void handleToggleFavorite(contextGame.id),
        },
        {
          key: 'open-folder',
          label: '📁 打开所在目录',
          onClick: () => void window.launcher?.shell.showItem({ filePath: contextGame.exePath }),
        },
        {
          key: 'delete',
          label: '🗑️ 删除游戏',
          danger: true,
          separatorBefore: true,
          onClick: () => setDeleteGameId(contextGame.id),
        },
      ]
    : []

  const recordSummary = useMemo(() => {
    const totalPlaytime = dataSource.reduce((sum, item) => sum + item.totalPlayTime, 0)
    const totalSessions = dataSource.reduce((sum, item) => sum + item.sessions.length, 0)
    const playedGames = dataSource.filter((item) => item.totalPlayTime > 0).length
    const lastPlayed = dataSource
      .map((item) => item.lastPlayed)
      .filter(Boolean)
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] as string | undefined

    const topByPlaytime = [...dataSource]
      .filter((item) => item.totalPlayTime > 0)
      .sort((a, b) => b.totalPlayTime - a.totalPlayTime)
      .slice(0, 6)

    const maxPlaytime = Math.max(...topByPlaytime.map((item) => item.totalPlayTime), 1)

    return {
      totalPlaytime,
      totalSessions,
      playedGames,
      lastPlayed,
      topByPlaytime,
      maxPlaytime,
    }
  }, [dataSource])

  return (
    <motion.section
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full w-full"
    >
      {mode === 'recent' ? (
        <section className="relative z-10 h-full overflow-hidden">
          <AnimatePresence>
            {recordMenuOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px]"
                onClick={() => setRecordMenuOpen(false)}
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {recordMenuOpen ? (
              <motion.div
                initial={{ x: -250, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -250, opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="console-panel absolute inset-y-0 left-0 z-30 w-[240px] rounded-r-[26px] border-white/22 p-3 shadow-[0_22px_56px_rgba(0,0,0,0.45)]"
              >
                <button
                  onClick={() => {
                    navigate('/settings')
                    setRecordMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base text-white/88 transition hover:bg-white/10"
                >
                  <span className="text-lg leading-none">⚙</span>
                  <span>设置</span>
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="h-full overflow-y-auto">
            <motion.div
              animate={{ x: recordMenuOpen ? RECORD_MENU_WIDTH : 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              className="relative flex h-full flex-col px-10 pb-7 pt-6"
              style={{ pointerEvents: recordMenuOpen ? 'none' : 'auto' }}
            >
              <div className="mb-8 flex items-center justify-between text-white/85">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setRecordMenuOpen((prev) => !prev)}
                    className="text-3xl font-semibold leading-none text-white/88 transition hover:text-white"
                    style={{ pointerEvents: 'auto' }}
                  >
                    ☰
                  </button>
                  <div className="flex items-center gap-10 text-[33px] font-semibold">
                    <button
                      onClick={() => navigate('/library')}
                      className="transition text-white/38 hover:text-white/78"
                    >
                      我的
                    </button>
                    <button
                      onClick={() => navigate('/favorites')}
                      className="transition text-white/38 hover:text-white/78"
                    >
                      收藏
                    </button>
                    <button
                      onClick={() => navigate('/recent')}
                      className="transition text-white"
                    >
                      记录
                    </button>
                  </div>
                </div>
              </div>

              <div className="console-panel rounded-2xl p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.24em] text-white/50">RECORD BOARD</p>
                    <h1 className="mt-2 font-display text-5xl text-white/95">记录看板</h1>
                    <p className="mt-2 text-sm text-white/62">统计你的总游玩时长、会话次数与单游戏表现</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/50">总游玩时长</p>
                <p className="mt-2 font-display text-3xl text-white/95">{formatMinutes(recordSummary.totalPlaytime)}</p>
              </div>
              <div className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/50">总游玩局数</p>
                <p className="mt-2 font-display text-3xl text-white/95">{recordSummary.totalSessions} 次</p>
              </div>
              <div className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/50">已游玩游戏</p>
                <p className="mt-2 font-display text-3xl text-white/95">{recordSummary.playedGames} 款</p>
              </div>
              <div className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/50">最近游玩</p>
                <p className="mt-2 text-lg text-white/90">{recordSummary.lastPlayed ? new Date(recordSummary.lastPlayed).toLocaleString('zh-CN') : '暂无记录'}</p>
              </div>
            </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <section className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                    <p className="text-sm text-white/65">各游戏游玩时长排行</p>
                    <div className="mt-3 space-y-3">
                      {recordSummary.topByPlaytime.length ? (
                        recordSummary.topByPlaytime.map((item) => {
                          const width = `${Math.max(10, Math.round((item.totalPlayTime / recordSummary.maxPlaytime) * 100))}%`
                          return (
                            <button
                              key={`record-bar-${item.id}`}
                              onClick={() => navigate(`/game/${item.id}`)}
                              onContextMenu={(event) => openContextMenu(event, item.id)}
                              className="w-full text-left"
                            >
                              <div className="mb-1 flex items-center justify-between text-xs text-white/72">
                                <span className="truncate">{item.name}</span>
                                <span>{formatMinutes(item.totalPlayTime)}</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-white/12">
                                <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width }} />
                              </div>
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-sm text-white/50">暂无游玩数据</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl bg-black/25 p-4 backdrop-blur-xl">
                    <p className="text-sm text-white/65">游戏记录卡片</p>
                    <div className="mt-3 space-y-2">
                      {modeFiltered.slice(0, 8).map((item) => (
                        <button
                          key={`record-card-${item.id}`}
                          onClick={() => navigate(`/game/${item.id}`)}
                          onContextMenu={(event) => openContextMenu(event, item.id)}
                          className="flex w-full items-center justify-between rounded-lg bg-white/8 px-3 py-2 text-left transition hover:bg-white/14"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/92">{item.name}</p>
                            <p className="text-xs text-white/55">{item.sessions.length} 次 · {formatMinutes(item.totalPlayTime)}</p>
                          </div>
                          <span className="text-xs text-white/55">{item.lastPlayed ? new Date(item.lastPlayed).toLocaleDateString('zh-CN') : '未游玩'}</span>
                        </button>
                      ))}
                      {!modeFiltered.length ? <p className="text-sm text-white/50">暂无可展示记录</p> : null}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        <HeroSection
          mode={mode}
          games={finalGames.slice(0, 8)}
          game={selectedGame}
          onSelect={setSelectedGameId}
          onLaunch={handleLaunch}
          onToggleFavorite={handleToggleFavorite}
          onContextMenu={openContextMenu}
          onOpenAddGame={() => {
            setAddGameModalOpen(true)
            navigate('/library')
          }}
        />
      )}

      <GameContextMenu
        open={Boolean(contextMenu && contextGame)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        actions={contextActions}
        onClose={() => setContextMenu(null)}
      />

      <EditGameModal open={Boolean(editingGame)} game={editingGame} onClose={() => setEditingGameId(null)} />

      <ConfirmDialog
        open={Boolean(deleteGame)}
        title="删除游戏"
        description={deleteGame ? `确定删除《${deleteGame.name}》吗？` : ''}
        confirmText="确认删除"
        cancelText="取消"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteGameId(null)}
      />
    </motion.section>
  )
}

export default Library
