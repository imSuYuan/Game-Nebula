import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRunningGameNames, launchGameFromMain, registerGameProcessHandlers } from './gameProcess.js'
import { registerIpcHandlers } from './ipc.js'
import { getGames, getSettings } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let trayTooltipTimer: NodeJS.Timeout | null = null

const startupSettings = getSettings()
if (startupSettings.gpuRenderingEnabled) {
  app.commandLine.appendSwitch('ignore-gpu-blocklist')
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  app.commandLine.appendSwitch('enable-zero-copy')
} else {
  app.disableHardwareAcceleration()
}

registerIpcHandlers(() => mainWindow)
registerGameProcessHandlers(() => mainWindow)

function createWindow(): void {
  const appIconPath = path.join(__dirname, '../../assets/app.ico')
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    icon: process.platform === 'win32' ? appIconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173'

  if (!app.isPackaged) {
    void mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexHtml = path.join(__dirname, '../../dist/index.html')
    void mainWindow.loadFile(indexHtml)
  }

  mainWindow.on('close', (event) => {
    const settings = getSettings()
    if (!isQuitting && settings.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function updateTrayTooltip(): void {
  if (!tray) {
    return
  }

  const running = getRunningGameNames()
  if (!running.length) {
    tray.setToolTip('Game Nebula')
    return
  }

  tray.setToolTip(`《${running[0]}》运行中`)
}

function updateTrayMenu(): void {
  if (!tray) {
    return
  }

  const games = getGames()
  const recent = [...games]
    .filter((game) => Boolean(game.lastPlayed))
    .sort((a, b) => new Date(b.lastPlayed ?? 0).getTime() - new Date(a.lastPlayed ?? 0).getTime())
    .slice(0, 3)

  const recentItems = recent.length
    ? recent.map((game) => ({
        label: game.name,
        click: () => {
          launchGameFromMain(() => mainWindow, { gameId: game.id, exePath: game.exePath, gameName: game.name })
          updateTrayTooltip()
        },
      }))
    : [{ label: '暂无记录', enabled: false }]

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '显示启动器',
        click: () => {
          if (!mainWindow) {
            return
          }

          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.show()
          mainWindow.focus()
        },
      },
      { type: 'separator' },
      { label: '最近游玩', enabled: false },
      ...recentItems,
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/tray.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)

  tray.on('double-click', () => {
    if (!mainWindow) {
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    mainWindow.show()
    mainWindow.focus()
  })

  updateTrayMenu()
  updateTrayTooltip()

  trayTooltipTimer = setInterval(() => {
    updateTrayMenu()
    updateTrayTooltip()
  }, 2500)
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  if (trayTooltipTimer) {
    clearInterval(trayTooltipTimer)
    trayTooltipTimer = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
