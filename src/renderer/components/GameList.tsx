import { motion } from 'framer-motion'
import { formatLastPlayed, formatPlaytime } from '../hooks/usePlaytime'
import SafeImage from './SafeImage'
import type { Game } from '../types/game'

interface GameListProps {
  games: Game[]
  selectedGameId: string | null
  onSelect: (gameId: string) => void
  onLaunch: (gameId: string) => void
  onContextMenu: (event: React.MouseEvent, gameId: string) => void
}

function GameList({ games, selectedGameId, onSelect, onLaunch, onContextMenu }: GameListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-[72px_1.6fr_1fr_1fr_1fr_140px] items-center border-b border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55">
        <span>封面</span>
        <span>名称</span>
        <span>类型</span>
        <span>总时长</span>
        <span>最后游玩</span>
        <span className="text-right">操作</span>
      </div>

      <div className="max-h-[460px] overflow-y-auto">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={() => onSelect(game.id)}
            onContextMenu={(event) => onContextMenu(event, game.id)}
            className={`grid cursor-pointer grid-cols-[72px_1.6fr_1fr_1fr_1fr_140px] items-center px-3 py-2 text-sm transition ${
              selectedGameId === game.id
                ? 'bg-[color:var(--accent)]/20 text-white'
                : 'border-b border-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            <div className="h-12 w-16 overflow-hidden rounded-md">
              <SafeImage path={game.coverImage} alt={game.name} className="h-full w-full object-cover object-center" />
            </div>
            <div className="truncate pr-4 font-medium">{game.name}</div>
            <div className="truncate pr-4 text-white/60">{game.genre.join(', ')}</div>
            <div className="pr-4 text-white/70">{formatPlaytime(game.totalPlayTime)}</div>
            <div className="pr-4 text-white/60">{formatLastPlayed(game.lastPlayed)}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onLaunch(game.id)
                }}
                className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/90 hover:bg-white/20"
              >
                ▶ 开始
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default GameList
