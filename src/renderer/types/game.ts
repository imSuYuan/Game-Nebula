export interface PlaySession {
  startTime: string
  endTime: string
  duration: number
}

export interface Game {
  id: string
  name: string
  exePath: string
  coverImage: string
  backgroundImage: string
  description: string
  genre: string[]
  developer: string
  totalPlayTime: number
  sessions: PlaySession[]
  lastPlayed: string | null
  addedAt: string
  isFavorite: boolean
  isRunning: boolean
}

export type PersistedGame = Omit<Game, 'isRunning'>
