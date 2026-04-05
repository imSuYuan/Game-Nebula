import { motion } from 'framer-motion'
import PlaytimeBadge from './PlaytimeBadge'
import SafeImage from './SafeImage'
import type { Game } from '../types/game'

interface GameCardProps {
  game: Game
  selected: boolean
  showPlaytime: boolean
  onSelect: (gameId: string) => void
  onLaunch: (gameId: string) => void
  onContextMenu: (event: React.MouseEvent, gameId: string) => void
}

function GameCard({ game, selected, showPlaytime, onSelect, onLaunch, onContextMenu }: GameCardProps) {
  return (
    <motion.article
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={() => onSelect(game.id)}
      onContextMenu={(event) => onContextMenu(event, game.id)}
      className={`glass-card-hover group relative cursor-pointer overflow-hidden rounded-xl border transition duration-150 ${
        selected
          ? 'border-[var(--accent)] shadow-[0_0_22px_rgba(96,165,250,0.35)]'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <SafeImage path={game.coverImage} alt={game.name} className="h-full w-full object-cover object-center" />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        <div className="absolute left-3 right-3 bottom-3">
          <p className="font-display text-xl leading-none text-white/92">{game.name}</p>
        </div>

        {game.isRunning ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            运行中
          </div>
        ) : null}

        {showPlaytime ? (
          <div className="absolute left-3 bottom-12">
            <PlaytimeBadge totalMinutes={game.totalPlayTime} />
          </div>
        ) : null}

        <button
          onClick={(event) => {
            event.stopPropagation()
            onLaunch(game.id)
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white opacity-0 backdrop-blur-sm transition duration-150 group-hover:opacity-100"
        >
          ▶ 开始
        </button>
      </div>
    </motion.article>
  )
}

export default GameCard
