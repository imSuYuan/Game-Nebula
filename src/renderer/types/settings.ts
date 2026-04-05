export interface Settings {
  accentColor: string
  defaultSortBy: 'name' | 'lastPlayed' | 'totalPlayTime' | 'addedAt'
  defaultView: 'grid' | 'list'
  gpuRenderingEnabled: boolean
  showPlaytimeOnCard: boolean
  minimizeToTray: boolean
  startWithWindows: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  accentColor: '#60A5FA',
  defaultSortBy: 'lastPlayed',
  defaultView: 'grid',
  gpuRenderingEnabled: true,
  showPlaytimeOnCard: true,
  minimizeToTray: false,
  startWithWindows: false,
}
