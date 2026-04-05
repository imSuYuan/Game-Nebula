import { BrowserWindow, ipcMain } from 'electron'
import { spawn } from 'node:child_process'

interface LaunchPayload {
  gameId: string
  exePath: string
}

interface RunningGame {
  pid: number
  startTime: Date
}

interface SessionPayload {
  startTime: string
  endTime: string
  duration: number
}

const runningGames = new Map<string, RunningGame>()
const runningGameNames = new Map<string, string>()

function emitToRenderer(
  getMainWindow: () => BrowserWindow | null,
  channel: 'game:launched' | 'game:session-ended' | 'game:launch-error',
  payload: unknown,
): void {
  const mainWindow = getMainWindow()
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send(channel, payload)
}

function launchGameInternal(
  getMainWindow: () => BrowserWindow | null,
  payload: LaunchPayload & { gameName?: string },
): { success: boolean; error?: string } {
  if (!payload?.gameId || !payload?.exePath) {
    return { success: false, error: '启动参数无效' }
  }

  if (runningGames.has(payload.gameId)) {
    return { success: false, error: '该游戏已在运行中' }
  }

  try {
    const child = spawn(payload.exePath, [], {
      detached: true,
      stdio: 'ignore',
    })

    child.unref()

    if (!child.pid) {
      throw new Error('Failed to obtain game process id.')
    }

    const startedAt = new Date()
    runningGames.set(payload.gameId, {
      pid: child.pid,
      startTime: startedAt,
    })

    if (payload.gameName) {
      runningGameNames.set(payload.gameId, payload.gameName)
    }

    emitToRenderer(getMainWindow, 'game:launched', { gameId: payload.gameId })

    ;(child as any).on('error', (error: Error) => {
      runningGames.delete(payload.gameId)
      runningGameNames.delete(payload.gameId)
      emitToRenderer(getMainWindow, 'game:launch-error', {
        gameId: payload.gameId,
        error: error.message,
      })
    })

    ;(child as any).on('exit', () => {
      const active = runningGames.get(payload.gameId)
      if (!active) {
        return
      }

      const endTime = new Date()
      const duration = Math.max(1, Math.round((endTime.getTime() - active.startTime.getTime()) / 60000))

      const session: SessionPayload = {
        startTime: active.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      }

      runningGames.delete(payload.gameId)
      runningGameNames.delete(payload.gameId)

      emitToRenderer(getMainWindow, 'game:session-ended', {
        gameId: payload.gameId,
        session,
      })
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '启动失败'

    emitToRenderer(getMainWindow, 'game:launch-error', {
      gameId: payload.gameId,
      error: message,
    })

    return { success: false, error: message }
  }
}

export function launchGameFromMain(
  getMainWindow: () => BrowserWindow | null,
  payload: LaunchPayload & { gameName?: string },
): { success: boolean; error?: string } {
  return launchGameInternal(getMainWindow, payload)
}

export function getRunningGameNames(): string[] {
  return [...runningGameNames.values()]
}

export function registerGameProcessHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('game:launch', (_event, payload: LaunchPayload) => {
    return launchGameInternal(getMainWindow, payload)
  })
}
