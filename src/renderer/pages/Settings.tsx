import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import type { Game, PersistedGame } from '../types/game'
import type { Settings } from '../types/settings'

const accentPresets = ['#60A5FA', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A78BFA']

function toRuntimeGame(game: PersistedGame): Game {
  return {
    ...game,
    isRunning: false,
  }
}

function mergeGames(current: Game[], imported: PersistedGame[]): Game[] {
  const merged = new Map<string, Game>()

  for (const item of current) {
    merged.set(item.id, item)
  }

  for (const item of imported) {
    merged.set(item.id, toRuntimeGame(item))
  }

  return [...merged.values()].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
}

function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const setAccentColor = useSettingsStore((state) => state.setAccentColor)

  const games = useGameStore((state) => state.games)
  const setGames = useGameStore((state) => state.setGames)

  const pushToast = useUIStore((state) => state.pushToast)

  const [appVersion, setAppVersion] = useState('...')
  const [userDataPath, setUserDataPath] = useState('')

  useEffect(() => {
    void window.launcher?.app.getVersion().then((version) => setAppVersion(version || '0.0.0'))
    void window.launcher?.app.getUserDataPath().then((p) => setUserDataPath(p || ''))
  }, [])

  const sortOptions = useMemo(
    () => [
      { value: 'name', label: '名称' },
      { value: 'lastPlayed', label: '最近游玩' },
      { value: 'totalPlayTime', label: '游玩时长' },
      { value: 'addedAt', label: '添加时间' },
    ] as const,
    [],
  )

  const updateToggle = (key: keyof Settings, value: boolean) => {
    void updateSettings({ [key]: value } as Partial<Settings>)
  }

  const handleStartWithWindows = async (enabled: boolean) => {
    await window.launcher?.app.setLoginItem({ enabled })
    await updateSettings({ startWithWindows: enabled })
    pushToast({ id: `login-item-${Date.now()}`, type: 'success', message: enabled ? '已开启开机自启' : '已关闭开机自启' })
  }

  const handleGpuRendering = async (enabled: boolean) => {
    await updateSettings({ gpuRenderingEnabled: enabled })
    pushToast({ id: `gpu-rendering-${Date.now()}`, type: 'info', message: enabled ? '已开启 GPU 渲染，重启应用后生效' : '已关闭 GPU 渲染，重启应用后生效' })
  }

  const handleExport = async () => {
    const ok = await window.launcher?.store.exportData()
    pushToast({
      id: `export-${Date.now()}`,
      type: ok ? 'success' : 'info',
      message: ok ? '数据导出完成' : '已取消导出',
    })
  }

  const handleImport = async () => {
    const imported = await window.launcher?.store.importData()
    if (!imported || !imported.length) {
      pushToast({ id: `import-empty-${Date.now()}`, type: 'info', message: '未导入到新数据' })
      return
    }

    const merged = mergeGames(games, imported)
    await setGames(merged)
    pushToast({ id: `import-${Date.now()}`, type: 'success', message: `已导入并合并 ${imported.length} 条记录` })
  }

  const contextPanelClass = 'console-panel rounded-xl shadow-[0_18px_48px_rgba(0,0,0,0.45)]'
  const contextCardClass = 'rounded-xl bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] backdrop-blur-[28px] shadow-[0_18px_48px_rgba(0,0,0,0.45)]'
  const blurBtnClass =
    'rounded-xl bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] px-4 py-2 text-sm text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.72),rgba(13,22,44,0.62))]'
  const blurInputClass =
    'w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-white/90 outline-none shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-[24px]'

  return (
    <motion.section initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="h-full w-full overflow-y-auto px-6 pb-10 pt-6">
      <section className={`${contextPanelClass} p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.28em] text-white/50">CONTROL HUB</p>
            <h1 className="mt-2 font-display text-6xl leading-none text-white/95">设置中心</h1>
            <p className="mt-2 text-sm text-white/65">统一管理视觉风格、系统行为和本地数据</p>
          </div>
          <Link to="/library" className={blurBtnClass}>返回首页</Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className={`${contextCardClass} p-4`}>
            <p className="text-xs text-white/55">当前版本</p>
            <p className="mt-2 font-display text-3xl text-white/92">v{appVersion}</p>
          </div>
          <div className={`${contextCardClass} p-4`}>
            <p className="text-xs text-white/55">GPU 渲染</p>
            <p className="mt-2 font-display text-3xl text-white/92">{settings.gpuRenderingEnabled ? '开启' : '关闭'}</p>
          </div>
          <div className={`${contextCardClass} p-4`}>
            <p className="text-xs text-white/55">开机自启</p>
            <p className="mt-2 font-display text-3xl text-white/92">{settings.startWithWindows ? '开启' : '关闭'}</p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className={`${contextPanelClass} p-5`}>
          <h2 className="font-display text-3xl text-white/90">外观</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-white/65">主题强调色</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {accentPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => void setAccentColor(color)}
                    className={`h-9 w-9 rounded-full border-2 transition ${settings.accentColor.toLowerCase() === color.toLowerCase() ? 'border-white scale-110' : 'border-white/25'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) => void setAccentColor(event.target.value)}
                  className="h-9 w-11 cursor-pointer rounded-xl bg-black/30 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-[24px]"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-white/65">GPU 渲染</span>
                <div className="flex rounded-xl bg-black/30 p-1 backdrop-blur-xl">
                  {[
                    { key: 'on', label: '开启' },
                    { key: 'off', label: '关闭' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => void handleGpuRendering(item.key === 'on')}
                      className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
                        (item.key === 'on' && settings.gpuRenderingEnabled) || (item.key === 'off' && !settings.gpuRenderingEnabled)
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/45">切换后需重启应用生效</p>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/65">默认排序</span>
                <select
                  value={settings.defaultSortBy}
                  onChange={(event) => void updateSettings({ defaultSortBy: event.target.value as Settings['defaultSortBy'] })}
                  className={blurInputClass}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={`${contextCardClass} flex items-center justify-between px-3 py-3 text-sm text-white/80`}>
              卡片显示游玩时长
              <input
                type="checkbox"
                checked={settings.showPlaytimeOnCard}
                onChange={(event) => updateToggle('showPlaytimeOnCard', event.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </div>
        </section>

        <section className={`${contextPanelClass} p-5`}>
          <h2 className="font-display text-3xl text-white/90">系统</h2>
          <div className="mt-4 space-y-3">
            <label className={`${contextCardClass} flex items-center justify-between px-3 py-3 text-sm text-white/80`}>
              开机自启
              <input
                type="checkbox"
                checked={settings.startWithWindows}
                onChange={(event) => void handleStartWithWindows(event.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className={`${contextCardClass} flex items-center justify-between px-3 py-3 text-sm text-white/80`}>
              关闭时最小化到托盘
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={(event) => updateToggle('minimizeToTray', event.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <div className={`${contextCardClass} p-3`}>
              <p className="text-sm text-white/65">数据存储路径</p>
              <p className="mt-1 break-all text-xs text-white/55">{userDataPath || '加载中...'}</p>
              <button
                onClick={() => void window.launcher?.shell.openPath({ dirPath: userDataPath })}
                className={`${blurBtnClass} mt-2 px-3 py-1.5 text-xs`}
                disabled={!userDataPath}
              >
                打开目录
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => void handleExport()} className={blurBtnClass}>导出数据</button>
              <button onClick={() => void handleImport()} className={blurBtnClass}>导入数据</button>
              <button onClick={() => pushToast({ id: `latest-${Date.now()}`, type: 'info', message: '已是最新版本' })} className={blurBtnClass}>检查更新</button>
            </div>
          </div>
        </section>
      </div>
    </motion.section>
  )
}

export default SettingsPage
