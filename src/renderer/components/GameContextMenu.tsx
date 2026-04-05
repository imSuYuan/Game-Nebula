import { useEffect, useMemo, useRef, useState } from 'react'

interface ContextMenuAction {
  key: string
  label: string
  danger?: boolean
  onClick: () => void
  separatorBefore?: boolean
}

interface GameContextMenuProps {
  open: boolean
  x: number
  y: number
  actions: ContextMenuAction[]
  onClose: () => void
}

const MENU_WIDTH = 220

function GameContextMenu({ open, x, y, actions, onClose }: GameContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuHeight, setMenuHeight] = useState(280)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }

      if (!menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, open])

  useEffect(() => {
    if (!open || !menuRef.current) {
      return
    }

    setMenuHeight(menuRef.current.offsetHeight)
  }, [actions, open])

  const pos = useMemo(() => {
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    const left = Math.min(Math.max(8, x), viewportW - MENU_WIDTH - 8)
    const top = Math.min(Math.max(8, y), viewportH - menuHeight - 8)

    return { left, top }
  }, [menuHeight, x, y])

  if (!open) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className="console-panel fixed z-[115] w-[220px] rounded-xl border-white/22 p-1 shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
      style={{ left: pos.left, top: pos.top }}
    >
      {actions.map((action) => (
        <div key={action.key}>
          <button
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
              action.danger
                ? 'text-rose-200 hover:bg-rose-500/18'
                : 'text-white/88 hover:bg-white/10'
            }`}
          >
            {action.label}
          </button>
        </div>
      ))}
    </div>
  )
}

export default GameContextMenu
