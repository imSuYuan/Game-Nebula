import type { CSSProperties } from 'react'

function TitleBar() {
  return (
    <header
      className="relative z-50 flex h-8 items-center justify-between bg-[linear-gradient(135deg,rgba(6,10,24,0.72),rgba(10,16,34,0.58))] px-3 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-[28px]"
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
    >
      <div className="font-display text-xs tracking-[0.24em] text-white/90">Game Nebula v0.1.0</div>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <button className="h-6 w-8 rounded-md bg-white/5 text-xs text-white/75 transition duration-150 hover:bg-white/15 hover:text-white" onClick={() => void window.launcher?.window.minimize()}>
          -
        </button>
        <button className="h-6 w-8 rounded-md bg-white/5 text-xs text-white/75 transition duration-150 hover:bg-white/15 hover:text-white" onClick={() => void window.launcher?.window.toggleMaximize()}>
          口
        </button>
        <button className="h-6 w-8 rounded-md bg-white/5 text-xs text-white/75 transition duration-150 hover:bg-rose-500/85 hover:text-white" onClick={() => void window.launcher?.window.close()}>
          x
        </button>
      </div>
    </header>
  )
}

export default TitleBar
