import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import EditGameModal from '../components/EditGameModal'
import SafeImage from '../components/SafeImage'
import { formatLastPlayed, formatPlaytime } from '../hooks/usePlaytime'
import { useGameStore } from '../store/useGameStore'
import { useUIStore } from '../store/useUIStore'

function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)
  const removeGame = useGameStore((state) => state.removeGame)
  const updateGame = useGameStore((state) => state.updateGame)
  const pushToast = useUIStore((state) => state.pushToast)
  const setSelectedGameId = useUIStore((state) => state.setSelectedGameId)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const game = useMemo(() => games.find((item) => item.id === id) ?? null, [games, id])

  const stats = useMemo(() => {
    if (!game) {
      return null
    }

    const sessionCount = game.sessions.length
    const avg = sessionCount ? Math.round(game.totalPlayTime / sessionCount) : 0

    return {
      sessionCount,
      avg,
      lastPlayed: formatLastPlayed(game.lastPlayed),
    }
  }, [game])

  useEffect(() => {
    if (!game) {
      return
    }

    setSelectedGameId(game.id)
  }, [game, setSelectedGameId])

  if (!game) {
    return (
      <section className="h-full w-full overflow-y-auto p-6">
        <div className="glass-panel rounded-2xl p-8">
          <h1 className="font-display text-4xl text-white/90">游戏不存在</h1>
          <p className="mt-2 text-white/60">该游戏可能已被删除。</p>
          <Link to="/library" className="mt-4 inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            ← 返回游戏库
          </Link>
        </div>
      </section>
    )
  }

  const sessionsToRender = showAllSessions ? game.sessions : game.sessions.slice(0, 20)

  const handleLaunch = async () => {
    const result = await window.launcher?.game.launch({ gameId: game.id, exePath: game.exePath })
    if (!result?.success) {
      pushToast({ id: `${game.id}-detail-launch-${Date.now()}`, type: 'error', message: '启动失败，请检查路径是否正确' })
    }
  }

  const handleDelete = async () => {
    await removeGame(game.id)
    setConfirmDeleteOpen(false)
    pushToast({ id: `${game.id}-deleted-${Date.now()}`, type: 'info', message: `已删除《${game.name}》` })
    navigate('/library')
  }

  const handleToggleFavorite = async () => {
    await updateGame(game.id, (item) => ({ ...item, isFavorite: !item.isFavorite }))
  }

  return (
    <section className="relative h-full w-full overflow-y-auto p-6 pb-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <SafeImage
          path={game.backgroundImage || game.coverImage}
          alt=""
          ariaHidden
          className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-center brightness-[0.5]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(130,167,255,0.2),transparent_42%),radial-gradient(circle_at_82%_82%,rgba(126,197,255,0.14),transparent_44%),linear-gradient(130deg,rgba(6,10,20,0.56),rgba(9,15,32,0.52),rgba(7,12,26,0.6))]" />
        <div className="absolute inset-0 backdrop-blur-[10px]" />
      </div>
      <section className="relative mb-5 flex min-h-[250px] items-end justify-between rounded-2xl p-6">
        <div className="console-panel flex w-full gap-5 rounded-2xl p-5">
          <div className="h-[210px] w-[158px] shrink-0 overflow-hidden rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
            <SafeImage path={game.coverImage} alt={game.name} className="h-full w-full object-cover object-center" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h1 className="truncate font-display text-5xl text-white/95">{game.name}</h1>
              <Link to="/library" className="console-btn">
                ← 返回
              </Link>
            </div>

            <p className="text-sm text-white/55">{game.developer || '开发商未填写'}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {game.genre.length ? (
                game.genre.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/50">暂无类型标签</span>
              )}
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-white/68">{game.description || '暂无简介。'}</p>
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="console-panel rounded-2xl p-4">
          <p className="text-xs text-white/50">总游玩时长</p>
          <p className="mt-2 font-display text-3xl text-white/92">{formatPlaytime(game.totalPlayTime)}</p>
        </div>
        <div className="console-panel rounded-2xl p-4">
          <p className="text-xs text-white/50">游玩次数</p>
          <p className="mt-2 font-display text-3xl text-white/92">{stats?.sessionCount ?? 0} 次</p>
        </div>
        <div className="console-panel rounded-2xl p-4">
          <p className="text-xs text-white/50">平均每次时长</p>
          <p className="mt-2 font-display text-3xl text-white/92">{stats?.avg ?? 0} 分钟</p>
        </div>
        <div className="console-panel rounded-2xl p-4">
          <p className="text-xs text-white/50">最后游玩</p>
          <p className="mt-2 font-display text-2xl text-white/92">{stats?.lastPlayed}</p>
        </div>
      </section>

      <section className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => void handleLaunch()}
          disabled={game.isRunning}
          className="console-btn-solid disabled:cursor-not-allowed disabled:opacity-60"
        >
          {game.isRunning ? '游戏进行中...' : '▶ 开始游戏'}
        </button>
        <button
          onClick={() => setEditModalOpen(true)}
          className="console-btn"
        >
          ✏️ 编辑信息
        </button>
        <button
          onClick={() => void window.launcher?.shell.showItem({ filePath: game.exePath })}
          className="console-btn"
        >
          📁 打开所在目录
        </button>
        <button
          onClick={() => void handleToggleFavorite()}
          className="console-btn"
        >
          {game.isFavorite ? '⭐ 取消收藏' : '⭐ 收藏'}
        </button>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/30"
        >
          🗑️ 删除游戏
        </button>
      </section>

      <section className="console-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-white/90">游玩记录</h2>
          {game.sessions.length > 20 ? (
            <button onClick={() => setShowAllSessions((prev) => !prev)} className="console-btn px-3 py-1 text-xs">
              {showAllSessions ? '仅显示最近20条' : '展开查看全部'}
            </button>
          ) : null}
        </div>

        {!game.sessions.length ? (
          <p className="text-sm text-white/55">还没有游玩记录，启动游戏后自动记录。</p>
        ) : (
          <div className="space-y-2">
            {sessionsToRender.map((session, index) => (
              <div key={`${session.startTime}-${index}`} className="console-card p-3">
                <p className="text-sm text-white/82">{format(new Date(session.startTime), 'yyyy-MM-dd HH:mm')} · {session.duration} 分钟</p>
                <p className="mt-1 text-xs text-white/55">
                  {format(new Date(session.startTime), 'HH:mm')} → {format(new Date(session.endTime), 'HH:mm')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="删除游戏"
        description={`确定删除《${game.name}》吗？该操作会从本地库移除记录。`}
        confirmText="确认删除"
        cancelText="取消"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <EditGameModal open={editModalOpen} game={game} onClose={() => setEditModalOpen(false)} />
    </section>
  )
}

export default GameDetail
