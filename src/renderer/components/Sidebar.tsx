import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../store/useUIStore'

interface NavItem {
  icon: string
  label: string
  route: 'library' | 'favorites' | 'recent' | 'settings'
  to: string
}

const navItems: NavItem[] = [
  { icon: '🎮', label: '游戏库', route: 'library', to: '/library' },
  { icon: '⭐', label: '收藏夹', route: 'favorites', to: '/favorites' },
  { icon: '🕐', label: '最近游玩', route: 'recent', to: '/recent' },
  { icon: '⚙️', label: '设置', route: 'settings', to: '/settings' },
]

function Sidebar() {
  const location = useLocation()
  const setActiveRoute = useUIStore((state) => state.setActiveRoute)
  const setAddGameModalOpen = useUIStore((state) => state.setAddGameModalOpen)

  useEffect(() => {
    const matched = navItems.find((item) => location.pathname.startsWith(item.to))
    setActiveRoute(matched?.route ?? 'library')
  }, [location.pathname, setActiveRoute])

  return (
    <aside className="glass-panel group relative z-20 m-4 mr-0 h-[calc(100%-2rem)] w-16 overflow-hidden rounded-xl transition-[width] duration-[250ms] ease-in-out hover:w-52">
      <div className="flex h-full flex-col p-2">
        <nav className="flex flex-1 flex-col gap-1 pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/70 transition duration-200',
                  'before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-[var(--accent)] before:opacity-0 before:transition',
                  isActive ? 'bg-white/10 text-white before:opacity-100' : 'hover:bg-white/8 hover:text-white/90',
                ].join(' ')
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setAddGameModalOpen(true)}
          className="mt-2 flex h-11 items-center justify-start gap-3 rounded-lg border border-[color:var(--accent)]/60 bg-[color:var(--accent)]/10 px-3 text-sm text-white/85 transition hover:bg-[color:var(--accent)]/20"
        >
          <span className="text-lg leading-none">＋</span>
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">添加游戏</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
