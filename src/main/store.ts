import Store from 'electron-store'

export interface PersistedPlaySession {
  startTime: string
  endTime: string
  duration: number
}

export interface PersistedGame {
  id: string
  name: string
  exePath: string
  coverImage: string
  backgroundImage: string
  description: string
  genre: string[]
  developer: string
  totalPlayTime: number
  sessions: PersistedPlaySession[]
  lastPlayed: string | null
  addedAt: string
  isFavorite: boolean
}

export interface Settings {
  accentColor: string
  defaultSortBy: 'name' | 'lastPlayed' | 'totalPlayTime' | 'addedAt'
  defaultView: 'grid' | 'list'
  gpuRenderingEnabled: boolean
  showPlaytimeOnCard: boolean
  minimizeToTray: boolean
  startWithWindows: boolean
}

export interface LauncherStoreSchema {
  games: PersistedGame[]
  settings: Settings
}

const DEFAULT_SETTINGS: Settings = {
  accentColor: '#60A5FA',
  defaultSortBy: 'lastPlayed',
  defaultView: 'grid',
  gpuRenderingEnabled: true,
  showPlaytimeOnCard: true,
  minimizeToTray: false,
  startWithWindows: false,
}

const launcherStore = new Store<LauncherStoreSchema>({
  name: 'game-vault',
  clearInvalidConfig: true,
  defaults: {
    games: [],
    settings: DEFAULT_SETTINGS,
  },
})

export function getGames(): PersistedGame[] {
  return launcherStore.get('games', [])
}

export function setGames(games: PersistedGame[]): void {
  launcherStore.set('games', games)
}

export function getSettings(): Settings {
  return launcherStore.get('settings', DEFAULT_SETTINGS)
}

export function setSettings(settings: Settings): void {
  launcherStore.set('settings', settings)
}

export function getStoreSnapshot(): LauncherStoreSchema {
  return {
    games: getGames(),
    settings: getSettings(),
  }
}
