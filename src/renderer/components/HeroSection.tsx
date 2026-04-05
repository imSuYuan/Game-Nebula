import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPlaytime } from '../hooks/usePlaytime'
import type { Game } from '../types/game'
import SafeImage, { preloadSafeImagePath } from './SafeImage'

interface HeroSectionProps {
  mode: 'library' | 'favorites' | 'recent'
  games: Game[]
  game: Game | null
  onSelect: (gameId: string) => void
  onLaunch: (gameId: string) => void
  onToggleFavorite: (gameId: string) => void
  onContextMenu: (event: React.MouseEvent, gameId: string) => void
  onOpenAddGame: () => void
}

const MENU_WIDTH = 240
const MENU_SHIFT_X = MENU_WIDTH

function HeroSection({ mode, games, game, onSelect, onLaunch, onToggleFavorite, onContextMenu, onOpenAddGame }: HeroSectionProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAllApps, setShowAllApps] = useState(false)
  const showAddActions = mode !== 'favorites'
  const blurBtnClass =
    'rounded-lg bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] px-3.5 py-1.5 text-sm font-medium text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.72),rgba(13,22,44,0.62))]'
  const blurBtnLargeClass =
    'rounded-xl bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] px-4 py-2.5 text-sm text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.72),rgba(13,22,44,0.62))]'

  const openSettings = () => {
    navigate('/settings')
    setMenuOpen(false)
  }

  const warmDetailAssets = (target: Game) => {
    void preloadSafeImagePath(target.coverImage)
    void preloadSafeImagePath(target.backgroundImage)
  }

  const openGameDetail = (target: Game, closeLaunchpad = false) => {
    warmDetailAssets(target)
    onSelect(target.id)
    if (closeLaunchpad) {
      setShowAllApps(false)
    }
    window.requestAnimationFrame(() => {
      navigate(`/game/${target.id}`)
    })
  }

  useEffect(() => {
    // Warm image cache so Launchpad open animation is not blocked by disk reads.
    const timer = window.setTimeout(() => {
      for (const item of games) {
        void preloadSafeImagePath(item.coverImage)
      }
    }, mode === 'library' ? 60 : 140)

    return () => {
      window.clearTimeout(timer)
    }
  }, [games, mode])

  const renderSidebarMenu = () => (
    <motion.div
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -250, opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="console-panel absolute inset-y-0 left-0 z-30 w-[240px] rounded-r-[26px] border-white/22 p-3 shadow-[0_22px_56px_rgba(0,0,0,0.45)]"
    >
      <button
        onClick={openSettings}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base text-white/88 transition hover:bg-white/10"
      >
        <span className="text-lg leading-none">⚙</span>
        <span>设置</span>
      </button>
    </motion.div>
  )

  if (!game) {
    return (
      <section className="relative z-10 h-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(20,28,68,0.42),transparent_46%),linear-gradient(135deg,#070910,#0c1022,#11183a)]" />

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>{menuOpen ? renderSidebarMenu() : null}</AnimatePresence>

        <motion.div
          animate={{ x: menuOpen ? MENU_SHIFT_X : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          className="relative flex h-full flex-col px-10 pb-7 pt-6"
          style={{ pointerEvents: menuOpen ? 'none' : 'auto' }}
        >
          <div className="mb-8 flex items-center justify-between text-white/85">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="text-3xl font-semibold leading-none text-white/88 transition hover:text-white"
                style={{ pointerEvents: 'auto' }}
              >
                ☰
              </button>
              <div className="flex items-center gap-10 text-[33px] font-semibold">
                <button
                  onClick={() => navigate('/library')}
                  className={`transition ${mode === 'library' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
                >
                  我的
                </button>
                <button
                  onClick={() => navigate('/favorites')}
                  className={`transition ${mode === 'favorites' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
                >
                  收藏
                </button>
                <button
                  onClick={() => navigate('/recent')}
                  className={`transition ${mode === 'recent' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
                >
                  记录
                </button>
              </div>
            </div>

            {showAddActions ? (
              <div className="flex items-center gap-3 text-sm text-white/80">
                <button onClick={onOpenAddGame} className={blurBtnClass}>
                  + 添加
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-24 max-w-3xl rounded-2xl bg-black/25 p-6">
            <h1 className="font-display text-5xl text-white/95">暂无可展示游戏</h1>
            <p className="mt-3 text-xl text-white/72">当前分类下没有内容，你可以返回“我的”或添加新游戏。</p>
            <div className="mt-6 flex items-center gap-2.5">
              <button onClick={() => navigate('/library')} className="rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-black hover:bg-white">
                返回我的
              </button>
              {showAddActions ? (
                <button onClick={onOpenAddGame} className={blurBtnLargeClass}>
                  + 添加游戏
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </section>
    )
  }

  return (
    <section className="relative z-10 h-full overflow-hidden">
      <div className="absolute inset-0">
        <SafeImage path={game.backgroundImage || game.coverImage} alt="" ariaHidden className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/46" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_36%,rgba(0,0,0,0.12),rgba(0,0,0,0.56)_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.06)_28%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>{menuOpen ? renderSidebarMenu() : null}</AnimatePresence>

      <AnimatePresence>
        {showAllApps ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 [transform:translateZ(0)] [will-change:opacity]"
            onClick={() => setShowAllApps(false)}
          >
            <div className="absolute inset-0 overflow-hidden">
              <SafeImage
                path={game.backgroundImage || game.coverImage}
                alt=""
                ariaHidden
                className="h-full w-full scale-[1.03] object-cover object-center brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(130,167,255,0.2),transparent_42%),radial-gradient(circle_at_82%_82%,rgba(126,197,255,0.14),transparent_44%),linear-gradient(130deg,rgba(6,10,20,0.56),rgba(9,15,32,0.52),rgba(7,12,26,0.6))]" />
              <div className="absolute inset-0 backdrop-blur-[10px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative z-10 flex h-full flex-col px-10 pb-24 pt-16 [transform:translateZ(0)] [will-change:transform,opacity]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <p className="text-[26px] font-semibold tracking-[0.06em] text-white/95">启动台</p>
                <button
                  className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-white/20"
                  onClick={() => setShowAllApps(false)}
                >
                  关闭
                </button>
              </div>

              <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {games.map((item) => (
                    <button
                      key={`all-${item.id}`}
                      onMouseEnter={() => warmDetailAssets(item)}
                      onFocus={() => warmDetailAssets(item)}
                      onClick={() => openGameDetail(item, true)}
                      onContextMenu={(event) => onContextMenu(event, item.id)}
                      className="group relative h-[132px] overflow-hidden rounded-[18px] bg-white/10 shadow-[0_16px_34px_rgba(0,0,0,0.34)] backdrop-blur-[16px] transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]"
                    >
                      <SafeImage path={item.coverImage} alt={item.name} className="h-full w-full object-cover object-center" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/24 to-transparent" />
                      <p className="absolute bottom-2.5 left-3 right-3 truncate text-left text-sm font-semibold text-white/95">{item.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        animate={{ x: menuOpen ? MENU_SHIFT_X : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="relative flex h-full flex-col px-10 pb-7 pt-6 [transform:translateZ(0)] [will-change:transform]"
        style={{ pointerEvents: menuOpen ? 'none' : 'auto' }}
      >
        <div className="mb-8 flex items-center justify-between text-white/85">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-3xl font-semibold leading-none text-white/88 transition hover:text-white"
              style={{ pointerEvents: 'auto' }}
            >
              ☰
            </button>
            <div className="flex items-center gap-10 text-[33px] font-semibold">
              <button
                onClick={() => navigate('/library')}
                className={`transition ${mode === 'library' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
              >
                我的
              </button>
              <button
                onClick={() => navigate('/favorites')}
                className={`transition ${mode === 'favorites' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
              >
                收藏
              </button>
              <button
                onClick={() => navigate('/recent')}
                className={`transition ${mode === 'recent' ? 'text-white' : 'text-white/38 hover:text-white/78'}`}
              >
                记录
              </button>
            </div>
          </div>

          {showAddActions ? (
            <div className="flex items-center gap-3 text-sm text-white/80">
              <button onClick={onOpenAddGame} className={blurBtnClass}>
                + 添加
              </button>
            </div>
          ) : null}
        </div>

        <div className="max-w-4xl rounded-2xl bg-black/22 px-3 py-4">
          <motion.h1
            key={game.id}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="font-display text-[58px] leading-none text-white [text-shadow:0_6px_24px_rgba(0,0,0,0.66)]"
          >
            {game.name}
          </motion.h1>
          <p className="mt-4 text-sm text-white/68">总游玩时长 {formatPlaytime(game.totalPlayTime)}</p>

          <div className="mt-6 flex items-center gap-2.5">
            <button
              onClick={() => onLaunch(game.id)}
              disabled={game.isRunning}
              className="rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition hover:bg-white disabled:opacity-60"
            >
              {game.isRunning ? '游戏进行中...' : '开始游戏'}
            </button>
            <button
              onClick={() => onToggleFavorite(game.id)}
              className={blurBtnLargeClass}
            >
              {game.isFavorite ? '取消收藏' : '收藏'}
            </button>
          </div>
        </div>

        <motion.div
          className="relative mt-auto pb-2 pt-4"
          animate={{ y: showAllApps ? -170 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ willChange: 'transform' }}
        >
          <div className="relative w-full rounded-[26px] bg-[linear-gradient(120deg,rgba(226,178,255,0.24),rgba(152,194,255,0.22),rgba(255,184,161,0.2))] px-4 py-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-[16px]">
            <div className="flex min-w-full gap-3 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {games.map((item) => (
                <motion.button
                  key={item.id}
                  animate={{ scale: item.id === game.id ? 1.03 : 1 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  whileHover={item.id === game.id ? undefined : { scale: 1.02 }}
                  onMouseEnter={() => warmDetailAssets(item)}
                  onFocus={() => warmDetailAssets(item)}
                  onClick={() => {
                    if (item.id === game.id) {
                      openGameDetail(item)
                      return
                    }

                    onSelect(item.id)
                  }}
                  onContextMenu={(event) => onContextMenu(event, item.id)}
                    className={`relative h-[102px] min-w-[236px] overflow-hidden rounded-[18px] transition-all duration-200 ease-out ${
                    item.id === game.id
                          ? 'z-10 shadow-[0_10px_20px_rgba(0,0,0,0.26),0_0_0_1px_rgba(255,255,255,0.18)]'
                          : 'shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.28)]'
                  }`}
                >
                  <SafeImage path={item.coverImage} alt={item.name} className="h-full w-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/14 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 text-left">
                    <p className="truncate text-sm font-semibold text-white/95">{item.name}</p>
                  </div>
                </motion.button>
              ))}

              <button
                onClick={() => setShowAllApps((prev) => !prev)}
                className="relative flex h-[102px] min-w-[236px] items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,rgba(8,14,30,0.5),rgba(11,18,36,0.42))] shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.62),rgba(13,22,44,0.54))]"
                aria-label="更多应用"
                title="更多"
              >
                <span className="grid grid-cols-2 gap-2">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-white/85" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-white/85" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-white/85" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-white/85" />
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default HeroSection
