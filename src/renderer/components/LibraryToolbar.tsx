import { useEffect, useMemo, useState } from 'react'
import type { Settings } from '../types/settings'

export type LibraryFilter = 'all' | 'favorite' | 'recent' | 'never'

interface LibraryToolbarProps {
  settings: Settings
  onSearch: (value: string) => void
  activeFilter: LibraryFilter
  onFilterChange: (filter: LibraryFilter) => void
  sortBy: Settings['defaultSortBy']
  onSortByChange: (sortBy: Settings['defaultSortBy']) => void
  view: Settings['defaultView']
  onViewChange: (view: Settings['defaultView']) => void
}

const filters: Array<{ key: LibraryFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'favorite', label: '收藏' },
  { key: 'recent', label: '最近游玩(7天内)' },
  { key: 'never', label: '从未游玩' },
]

function LibraryToolbar({
  settings,
  onSearch,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortByChange,
  view,
  onViewChange,
}: LibraryToolbarProps) {
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(searchText)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [onSearch, searchText])

  const sortOptions = useMemo(
    () => [
      { value: 'name', label: '名称' },
      { value: 'lastPlayed', label: '最近游玩' },
      { value: 'totalPlayTime', label: '游玩时长' },
      { value: 'addedAt', label: '添加时间' },
    ] as const,
    [],
  )

  return (
    <section className="relative z-10 px-6 pb-4">
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl p-3">
        <label className="flex min-w-[220px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
          <span>🔍</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜索游戏名称..."
            className="w-full bg-transparent text-white/90 outline-none placeholder:text-white/35"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => onFilterChange(item.key)}
              className={`rounded-lg px-3 py-2 text-xs transition ${
                activeFilter === item.key ? 'bg-[var(--accent)] text-white' : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as Settings['defaultSortBy'])}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/85 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                {option.label}
              </option>
            ))}
          </select>

          <div className="rounded-lg border border-white/15 bg-white/10 p-1">
            <button
              onClick={() => onViewChange('grid')}
              className={`rounded-md px-2 py-1 text-sm transition ${view === 'grid' ? 'bg-[var(--accent)] text-white' : 'text-white/70 hover:bg-white/10'}`}
            >
              ⊞
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`rounded-md px-2 py-1 text-sm transition ${view === 'list' ? 'bg-[var(--accent)] text-white' : 'text-white/70 hover:bg-white/10'}`}
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-white/45">默认视图: {settings.defaultView === 'grid' ? '网格' : '列表'} | 主题色: {settings.accentColor}</p>
    </section>
  )
}

export default LibraryToolbar
