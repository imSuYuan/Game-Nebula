import { app, BrowserWindow, dialog, ipcMain, shell, type OpenDialogOptions } from 'electron'
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getGames, getSettings, getStoreSnapshot, setGames, setSettings, type PersistedGame, type Settings } from './store.js'

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.bmp') return 'image/bmp'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

function sanitizeGames(payload: unknown): PersistedGame[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload as PersistedGame[]
}

function sanitizeSettings(payload: unknown, fallback: Settings): Settings {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  return {
    ...fallback,
    ...(payload as Partial<Settings>),
  }
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('window:minimize', () => {
    getMainWindow()?.minimize()
  })

  ipcMain.handle('window:toggle-maximize', () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) {
      return false
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return false
    }

    mainWindow.maximize()
    return true
  })

  ipcMain.handle('window:close', () => {
    getMainWindow()?.close()
  })

  ipcMain.handle('window:is-maximized', () => {
    return getMainWindow()?.isMaximized() ?? false
  })

  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle('app:set-login-item', (_event, payload: unknown) => {
    const input = payload as { enabled?: boolean } | undefined
    app.setLoginItemSettings({ openAtLogin: Boolean(input?.enabled) })
  })

  ipcMain.handle('app:get-user-data-path', () => {
    return app.getPath('userData')
  })

  ipcMain.handle('dialog:open-exe', async () => {
    const options: OpenDialogOptions = {
      title: '选择游戏可执行文件',
      properties: ['openFile'],
      filters: [{ name: 'Executable', extensions: ['exe'] }],
    }

    const parent = getMainWindow()
    const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:open-image', async () => {
    const options: OpenDialogOptions = {
      title: '选择图片',
      properties: ['openFile'],
      filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    }

    const parent = getMainWindow()
    const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:open-folder', async () => {
    const options: OpenDialogOptions = {
      title: '选择文件夹',
      properties: ['openDirectory'],
    }

    const parent = getMainWindow()
    const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('file:copy-to-userData', async (_event, payload: unknown) => {
    const input = payload as { srcPath?: string; destDir?: string; filename?: string } | undefined

    if (!input?.srcPath || !input.destDir || !input.filename) {
      throw new Error('Invalid payload for file:copy-to-userData')
    }

    const targetDir = path.join(app.getPath('userData'), input.destDir)
    await mkdir(targetDir, { recursive: true })

    const targetFile = path.join(targetDir, input.filename)
    await copyFile(input.srcPath, targetFile)

    return targetFile
  })

  ipcMain.handle('file:delete', async (_event, payload: unknown) => {
    const input = payload as { filePath?: string } | undefined
    if (!input?.filePath) {
      return false
    }

    try {
      await rm(input.filePath, { force: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('file:read-as-data-url', async (_event, payload: unknown) => {
    const input = payload as { filePath?: string } | undefined
    if (!input?.filePath) {
      return null
    }

    try {
      const content = await readFile(input.filePath)
      const mimeType = getMimeType(input.filePath)
      return `data:${mimeType};base64,${content.toString('base64')}`
    } catch {
      return null
    }
  })

  ipcMain.handle('shell:show-item', (_event, payload: unknown) => {
    const input = payload as { filePath?: string } | undefined
    if (!input?.filePath) {
      return
    }

    shell.showItemInFolder(input.filePath)
  })

  ipcMain.handle('shell:open-path', async (_event, payload: unknown) => {
    const input = payload as { dirPath?: string } | undefined
    if (!input?.dirPath) {
      return
    }

    await shell.openPath(input.dirPath)
  })

  ipcMain.handle('store:get-all', () => {
    return getStoreSnapshot()
  })

  ipcMain.handle('store:get-games', () => {
    return getGames()
  })

  ipcMain.handle('store:set-games', (_event, payload: unknown) => {
    const games = sanitizeGames(payload)
    setGames(games)
    return true
  })

  ipcMain.handle('store:get-settings', () => {
    return getSettings()
  })

  ipcMain.handle('store:set-settings', (_event, payload: unknown) => {
    const nextSettings = sanitizeSettings(payload, getSettings())
    setSettings(nextSettings)
    return nextSettings
  })

  ipcMain.handle('store:export', async () => {
    const parent = getMainWindow()
    const result = parent
      ? await dialog.showSaveDialog(parent, {
          title: '导出启动器数据',
          defaultPath: `game-vault-export-${Date.now()}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })
      : await dialog.showSaveDialog({
          title: '导出启动器数据',
          defaultPath: `game-vault-export-${Date.now()}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })

    if (result.canceled || !result.filePath) {
      return false
    }

    await writeFile(result.filePath, JSON.stringify(getStoreSnapshot(), null, 2), 'utf-8')
    return true
  })

  ipcMain.handle('store:import', async () => {
    const parent = getMainWindow()
    const result = parent
      ? await dialog.showOpenDialog(parent, {
          title: '导入启动器数据',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })
      : await dialog.showOpenDialog({
          title: '导入启动器数据',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })

    if (result.canceled || !result.filePaths.length) {
      return []
    }

    const filePath = result.filePaths[0]
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { games?: PersistedGame[] }
    return Array.isArray(parsed.games) ? parsed.games : []
  })
}
