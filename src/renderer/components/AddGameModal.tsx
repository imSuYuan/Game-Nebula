import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useGameStore } from '../store/useGameStore'
import { useUIStore } from '../store/useUIStore'
import type { Game } from '../types/game'
import SafeImage from './SafeImage'

interface AddGameModalProps {
  open: boolean
  onClose: () => void
}

function deriveNameFromExe(exePath: string): string {
  const normalized = exePath.replace(/\\/g, '/')
  const base = normalized.slice(normalized.lastIndexOf('/') + 1)
  const fileName = base.replace(/\.[^.]+$/, '')
  return fileName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function extWithDot(filePath: string): string {
  const match = filePath.match(/(\.[a-zA-Z0-9]+)$/)
  return match?.[1] || '.png'
}

function AddGameModal({ open, onClose }: AddGameModalProps) {
  const addGame = useGameStore((state) => state.addGame)
  const setSelectedGameId = useUIStore((state) => state.setSelectedGameId)
  const pushToast = useUIStore((state) => state.pushToast)

  const [exePath, setExePath] = useState('')
  const [name, setName] = useState('')
  const [developer, setDeveloper] = useState('')
  const [description, setDescription] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [coverPath, setCoverPath] = useState('')
  const [backgroundPath, setBackgroundPath] = useState('')
  const [saving, setSaving] = useState(false)
  const unifiedRadiusClass = 'rounded-xl'
  const blurInputClass =
    'w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/35 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-[24px]'
  const blurBtnClass =
    'rounded-xl bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] px-4 py-2 text-sm text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.72),rgba(13,22,44,0.62))]'
  const imageSelectBtnClass =
    'rounded-xl bg-black/30 px-4 py-2 text-sm text-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-black/40'

  const coverReady = Boolean(coverPath)

  const canSubmit = useMemo(() => {
    return Boolean(exePath && name.trim() && coverReady && !saving)
  }, [coverReady, exePath, name, saving])

  const resetForm = () => {
    setExePath('')
    setName('')
    setDeveloper('')
    setDescription('')
    setGenres([])
    setTagInput('')
    setCoverPath('')
    setBackgroundPath('')
  }

  const handleSelectExe = async () => {
    const selected = await window.launcher?.dialog.openExe()
    if (!selected) {
      return
    }

    setExePath(selected)
    setName((prev) => prev || deriveNameFromExe(selected))
  }

  const handleSelectCover = async () => {
    const selected = await window.launcher?.dialog.openImage()
    if (!selected) {
      return
    }

    setCoverPath(selected)
  }

  const handleSelectBackground = async () => {
    const selected = await window.launcher?.dialog.openImage()
    if (!selected) {
      return
    }

    setBackgroundPath(selected)
  }

  const commitTag = () => {
    const next = tagInput.trim().replace(/,+$/g, '')
    if (!next) {
      return
    }

    setGenres((prev) => (prev.includes(next) ? prev : [...prev, next]))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setGenres((prev) => prev.filter((item) => item !== tag))
  }

  const handleAdd = async () => {
    if (!canSubmit || !coverPath) {
      return
    }

    try {
      setSaving(true)

      const id = uuidv4()
      const coverExt = extWithDot(coverPath)
      const coverImage = await window.launcher?.file.copyToUserData({
        srcPath: coverPath,
        destDir: 'covers',
        filename: `${id}${coverExt}`,
      })

      const backgroundSource = backgroundPath || coverPath
      const bgExt = extWithDot(backgroundSource)
      const backgroundImage = await window.launcher?.file.copyToUserData({
        srcPath: backgroundSource,
        destDir: 'backgrounds',
        filename: `${id}${bgExt}`,
      })

      const nowIso = new Date().toISOString()

      const game: Game = {
        id,
        name: name.trim(),
        exePath,
        coverImage: coverImage ?? '',
        backgroundImage: backgroundImage ?? '',
        description: description.trim(),
        genre: genres,
        developer: developer.trim(),
        totalPlayTime: 0,
        sessions: [],
        lastPlayed: null,
        addedAt: nowIso,
        isFavorite: false,
        isRunning: false,
      }

      await addGame(game)
      setSelectedGameId(game.id)
      pushToast({ id: uuidv4(), type: 'success', message: `已添加《${game.name}》` })
      resetForm()
      onClose()
    } catch {
      pushToast({ id: uuidv4(), type: 'error', message: '添加失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="console-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6"
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-3xl text-white/90">添加游戏</h2>
                <p className="mt-1 text-sm text-white/55">从本地导入可执行文件与封面图</p>
              </div>
              <button onClick={onClose} className={blurBtnClass}>
                关闭
              </button>
            </div>

            <div className="space-y-5">
              <section className="space-y-2">
                <p className="text-sm text-white/65">1. 选择可执行文件</p>
                <button onClick={() => void handleSelectExe()} className={blurBtnClass}>
                  选择 .exe 文件
                </button>
                {exePath ? <p className="text-xs text-white/55">{exePath}</p> : null}
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-white/65">游戏名称 *</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={blurInputClass} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/65">开发商</span>
                  <input value={developer} onChange={(e) => setDeveloper(e.target.value)} className={blurInputClass} />
                </label>
              </section>

              <label className="space-y-2">
                <span className="text-sm text-white/65">简介</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述一下这个游戏..."
                  rows={3}
                  className={blurInputClass}
                />
              </label>

              <section className="space-y-2">
                <p className="text-sm text-white/65">类型标签</p>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      commitTag()
                    }
                  }}
                  placeholder="输入后按 Enter 或逗号添加"
                  className={blurInputClass}
                />
                <div className="flex flex-wrap gap-2">
                  {genres.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-xl">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-white/60 hover:text-white">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-white/65">封面图 (Dock矩形) *</p>
                  <div className={`aspect-[236/102] overflow-hidden ${unifiedRadiusClass} bg-black/30 backdrop-blur-xl`}>
                    {coverPath ? <SafeImage path={coverPath} alt="cover" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-white/45">未选择封面</div>}
                  </div>
                  <button onClick={() => void handleSelectCover()} className={imageSelectBtnClass}>
                    选择封面图
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/65">背景大图 (16:9，可选)</p>
                  <div className={`aspect-video overflow-hidden ${unifiedRadiusClass} bg-black/30 backdrop-blur-xl`}>
                    {backgroundPath ? <SafeImage path={backgroundPath} alt="background" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-white/45">不选择则默认使用封面图</div>}
                  </div>
                  <button onClick={() => void handleSelectBackground()} className={imageSelectBtnClass}>
                    选择背景大图 (可选)
                  </button>
                  <p className="text-xs text-white/45">建议使用游戏官方宣传图，横版大图效果最佳</p>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className={blurBtnClass}>
                取消
              </button>
              <button
                onClick={() => void handleAdd()}
                disabled={!canSubmit}
                className={`${blurBtnClass} disabled:cursor-not-allowed disabled:opacity-55`}
              >
                {saving ? '添加中...' : '确认添加'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default AddGameModal
