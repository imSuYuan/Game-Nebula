import { AnimatePresence, motion } from 'framer-motion'
import GameCard from './GameCard'
import type { Game } from '../types/game'

interface GameGridProps {
  games: Game[]
  selectedGameId: string | null
  showPlaytime: boolean
  onSelect: (gameId: string) => void
  onLaunch: (gameId: string) => void
  onContextMenu: (event: React.MouseEvent, gameId: string) => void
}

function GameGrid({ games, selectedGameId, showPlaytime, onSelect, onLaunch, onContextMenu }: GameGridProps) {
  return (
    <motion.div layout className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <AnimatePresence>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            selected={selectedGameId === game.id}
            showPlaytime={showPlaytime}
            onSelect={onSelect}
            onLaunch={onLaunch}
            onContextMenu={onContextMenu}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default GameGrid
