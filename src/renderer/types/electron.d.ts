export {}

import type { PersistedGame } from './game'
import type { Settings } from './settings'

interface PlaySessionPayload {
  startTime: string
  endTime: string
  duration: number
}

declare global {
  interface Window {
    launcher?: {
      window: {
        minimize: () => Promise<void>
        toggleMaximize: () => Promise<boolean>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
      app: {
        getVersion: () => Promise<string>
        setLoginItem: (payload: { enabled: boolean }) => Promise<void>
        getUserDataPath: () => Promise<string>
      }
      dialog: {
        openExe: () => Promise<string | null>
        openImage: () => Promise<string | null>
        openFolder: () => Promise<string | null>
      }
      file: {
        copyToUserData: (payload: { srcPath: string; destDir: string; filename: string }) => Promise<string>
        delete: (payload: { filePath: string }) => Promise<boolean>
        readAsDataUrl: (payload: { filePath: string }) => Promise<string | null>
      }
      game: {
        launch: (payload: { gameId: string; exePath: string }) => Promise<{ success: boolean; error?: string }>
      }
      shell: {
        showItem: (payload: { filePath: string }) => Promise<void>
        openPath: (payload: { dirPath: string }) => Promise<void>
      }
      store: {
        getAll: () => Promise<{ games: PersistedGame[]; settings: Settings }>
        getGames: () => Promise<PersistedGame[]>
        setGames: (games: PersistedGame[]) => Promise<boolean>
        getSettings: () => Promise<Settings>
        setSettings: (settings: Settings) => Promise<Settings>
        exportData: () => Promise<boolean>
        importData: () => Promise<PersistedGame[]>
      }
      ipc: {
        invoke: <T>(channel: string, payload?: unknown) => Promise<T>
        on: (channel: string, listener: (payload: unknown) => void) => () => void
      }
      events: {
        onGameLaunched: (listener: (payload: { gameId: string }) => void) => () => void
        onGameSessionEnded: (listener: (payload: { gameId: string; session: PlaySessionPayload }) => void) => () => void
        onGameLaunchError: (listener: (payload: { gameId: string; error: string }) => void) => () => void
      }
    }
  }
}
