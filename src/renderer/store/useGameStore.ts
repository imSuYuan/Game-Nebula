import { create } from 'zustand'
import type { Game, PersistedGame } from '../types/game'

interface GameState {
  games: Game[]
  hydrated: boolean
  hydrate: () => Promise<void>
  setGames: (games: Game[]) => Promise<void>
  addGame: (game: Game) => Promise<void>
  updateGame: (gameId: string, updater: (game: Game) => Game) => Promise<void>
  removeGame: (gameId: string) => Promise<void>
}

function toRuntimeGame(game: PersistedGame): Game {
  return {
    ...game,
    isRunning: false,
  }
}

function toPersistedGame(game: Game): PersistedGame {
  const { isRunning: _isRunning, ...persisted } = game
  return persisted
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  hydrated: false,

  hydrate: async () => {
    const storedGames = await window.launcher?.store.getGames()
    const runtimeGames = (storedGames ?? []).map(toRuntimeGame)
    set({ games: runtimeGames, hydrated: true })
  },

  setGames: async (games) => {
    set({ games })
    await window.launcher?.store.setGames(games.map(toPersistedGame))
  },

  addGame: async (game) => {
    const nextGames = [game, ...get().games]
    set({ games: nextGames })
    await window.launcher?.store.setGames(nextGames.map(toPersistedGame))
  },

  updateGame: async (gameId, updater) => {
    const nextGames = get().games.map((game) => (game.id === gameId ? updater(game) : game))
    set({ games: nextGames })
    await window.launcher?.store.setGames(nextGames.map(toPersistedGame))
  },

  removeGame: async (gameId) => {
    const nextGames = get().games.filter((game) => game.id !== gameId)
    set({ games: nextGames })
    await window.launcher?.store.setGames(nextGames.map(toPersistedGame))
  },
}))
