import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('launcher', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
    setLoginItem: (payload: { enabled: boolean }) => ipcRenderer.invoke('app:set-login-item', payload) as Promise<void>,
    getUserDataPath: () => ipcRenderer.invoke('app:get-user-data-path') as Promise<string>,
  },
  dialog: {
    openExe: () => ipcRenderer.invoke('dialog:open-exe') as Promise<string | null>,
    openImage: () => ipcRenderer.invoke('dialog:open-image') as Promise<string | null>,
    openFolder: () => ipcRenderer.invoke('dialog:open-folder') as Promise<string | null>,
  },
  file: {
    copyToUserData: (payload: { srcPath: string; destDir: string; filename: string }) =>
      ipcRenderer.invoke('file:copy-to-userData', payload) as Promise<string>,
    delete: (payload: { filePath: string }) => ipcRenderer.invoke('file:delete', payload) as Promise<boolean>,
    readAsDataUrl: (payload: { filePath: string }) => ipcRenderer.invoke('file:read-as-data-url', payload) as Promise<string | null>,
  },
  game: {
    launch: (payload: { gameId: string; exePath: string }) =>
      ipcRenderer.invoke('game:launch', payload) as Promise<{ success: boolean; error?: string }>,
  },
  shell: {
    showItem: (payload: { filePath: string }) => ipcRenderer.invoke('shell:show-item', payload) as Promise<void>,
    openPath: (payload: { dirPath: string }) => ipcRenderer.invoke('shell:open-path', payload) as Promise<void>,
  },
  store: {
    getAll: () => ipcRenderer.invoke('store:get-all'),
    getGames: () => ipcRenderer.invoke('store:get-games'),
    setGames: (games: unknown[]) => ipcRenderer.invoke('store:set-games', games) as Promise<boolean>,
    getSettings: () => ipcRenderer.invoke('store:get-settings'),
    setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('store:set-settings', settings),
    exportData: () => ipcRenderer.invoke('store:export') as Promise<boolean>,
    importData: () => ipcRenderer.invoke('store:import'),
  },
  ipc: {
    invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
    on: (channel: string, listener: (payload: unknown) => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
      ipcRenderer.on(channel, wrapped)
      return () => ipcRenderer.removeListener(channel, wrapped)
    },
  },
  events: {
    onGameLaunched: (listener: (payload: { gameId: string }) => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, payload: { gameId: string }) => listener(payload)
      ipcRenderer.on('game:launched', wrapped)
      return () => ipcRenderer.removeListener('game:launched', wrapped)
    },
    onGameSessionEnded: (listener: (payload: { gameId: string; session: { startTime: string; endTime: string; duration: number } }) => void) => {
      const wrapped = (
        _event: Electron.IpcRendererEvent,
        payload: { gameId: string; session: { startTime: string; endTime: string; duration: number } },
      ) => listener(payload)
      ipcRenderer.on('game:session-ended', wrapped)
      return () => ipcRenderer.removeListener('game:session-ended', wrapped)
    },
    onGameLaunchError: (listener: (payload: { gameId: string; error: string }) => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, payload: { gameId: string; error: string }) => listener(payload)
      ipcRenderer.on('game:launch-error', wrapped)
      return () => ipcRenderer.removeListener('game:launch-error', wrapped)
    },
  },
})
