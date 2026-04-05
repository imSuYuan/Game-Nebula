import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useGameStore } from '../store/useGameStore'
import { useUIStore } from '../store/useUIStore'
import type { Game } from '../types/game'
import SafeImage from './SafeImage'

interface EditGameModalProps {
  open: boolean
  game: Game | null
  onClose: () => void
}

function extWithDot(filePath: string): string {
  const match = filePath.match(/(\.[a-zA-Z0-9]+)$/)
  return match?.[1]?.toLowerCase() || '.png'
}

function fileNameFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.slice(normalized.lastIndexOf('/') + 1)
}

function EditGameModal({ open, game, onClose }: EditGameModalProps) {
  const updateGame = useGameStore((state) => state.updateGame)
  const pushToast = useUIStore((state) => state.pushToast)

  const [name, setName] = useState('')
  const [exePath, setExePath] = useState('')
  const [developer, setDeveloper] = useState('')
  const [description, setDescription] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [saving, setSaving] = useState(false)
  const unifiedRadiusClass = 'rounded-xl'
  const blurInputClass =
    'w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/35 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-[24px]'
  const blurBtnClass =
    'rounded-xl bg-[linear-gradient(135deg,rgba(8,14,30,0.62),rgba(11,18,36,0.5))] px-4 py-2 text-sm text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px] transition hover:bg-[linear-gradient(135deg,rgba(10,17,36,0.72),rgba(13,22,44,0.62))]'
  const imageSelectBtnClass =
    'rounded-xl bg-black/30 px-4 py-2 text-sm text-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-black/40'

  useEffect(() => {
    if (!open || !game) {
      return
    }

    setName(game.name)
    setExePath(game.exePath)
    setDeveloper(game.developer)
    setDescription(game.description)
    setGenres(game.genre)
    setTagInput('')
    setCoverImage(game.coverImage)
    setBackgroundImage(game.backgroundImage)
  }, [game, open])

  const canSave = useMemo(() => Boolean(game && name.trim() && exePath && coverImage && !saving), [coverImage, exePath, game, name, saving])

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

  const handleSelectExe = async () => {
    const selected = await window.launcher?.dialog.openExe()
    if (selected) {
      setExePath(selected)
    }
  }

  const replaceImage = async (kind: 'cover' | 'background') => {
    if (!game) {
      return
    }

    const selected = await window.launcher?.dialog.openImage()
    if (!selected) {
      return
    }

    const ext = extWithDot(selected)
    const folder = kind === 'cover' ? 'covers' : 'backgrounds'
    const nextFilename = `${game.id}${ext}`

    const copied = await window.launcher?.file.copyToUserData({
      srcPath: selected,
      destDir: folder,
      filename: nextFilename,
    })

    if (!copied) {
      return
    }

    const previous = kind === 'cover' ? coverImage : backgroundImage
    if (previous && previous !== copied) {
      await window.launcher?.file.delete({ filePath: previous })
    }

    if (kind === 'cover') {
      setCoverImage(copied)
    } else {
      setBackgroundImage(copied)
    }
  }

  const handleSave = async () => {
    if (!game || !canSave) {
      return
    }

    try {
      setSaving(true)

      await updateGame(game.id, (prev) => ({
        ...prev,
        name: name.trim(),
        exePath,
        coverImage,
        backgroundImage: backgroundImage || coverImage,
        description: description.trim(),
        genre: genres,
        developer: developer.trim(),
      }))

      pushToast({ id: uuidv4(), type: 'success', message: '已保存' })
      onClose()
    } catch {
      pushToast({ id: uuidv4(), type: 'error', message: '保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && game ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
          onClick={onClose}
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
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-display text-3xl text-white/90">编辑游戏信息</h2>
                <p className="mt-1 text-sm text-white/55">修改后将立即更新到本地库</p>
              </div>
              <button onClick={onClose} className={blurBtnClass}>
                关闭
              </button>
            </div>

            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm text-white/65">游戏名称</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={blurInputClass} />
              </label>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-2">
                  <span className="text-sm text-white/65">可执行文件路径</span>
                  <input value={exePath} readOnly className={`${blurInputClass} text-white/70`} />
                </label>
                <button onClick={() => void handleSelectExe()} className={blurBtnClass}>
                  重新选择
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-white/65">封面图 (Dock矩形)</p>
                  <div className={`aspect-[236/102] overflow-hidden ${unifiedRadiusClass} bg-black/30 backdrop-blur-xl`}>
                    {coverImage ? <SafeImage path={coverImage} alt={fileNameFromPath(coverImage)} className="h-full w-full object-cover" /> : null}
                  </div>
                  <button onClick={() => void replaceImage('cover')} className={imageSelectBtnClass}>
                    更换封面
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/65">背景图</p>
                  <div className={`aspect-video overflow-hidden ${unifiedRadiusClass} bg-black/30 backdrop-blur-xl`}>
                    {backgroundImage ? <SafeImage path={backgroundImage} alt={fileNameFromPath(backgroundImage)} className="h-full w-full object-cover" /> : null}
                  </div>
                  <button onClick={() => void replaceImage('background')} className={imageSelectBtnClass}>
                    更换背景图
                  </button>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm text-white/65">简介</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={blurInputClass} />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/65">开发商</span>
                <input value={developer} onChange={(e) => setDeveloper(e.target.value)} className={blurInputClass} />
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
                  className={blurInputClass}
                  placeholder="输入后按 Enter 或逗号添加"
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
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className={blurBtnClass}>
                取消
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={!canSave}
                className={`${blurBtnClass} disabled:cursor-not-allowed disabled:opacity-55`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default EditGameModal
