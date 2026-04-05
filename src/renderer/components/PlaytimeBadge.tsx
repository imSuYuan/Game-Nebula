import { formatPlaytime } from '../hooks/usePlaytime'

interface PlaytimeBadgeProps {
  totalMinutes: number
}

function PlaytimeBadge({ totalMinutes }: PlaytimeBadgeProps) {
  return (
    <span className="rounded-md border border-white/20 bg-black/35 px-2 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm">
      {formatPlaytime(totalMinutes)}
    </span>
  )
}

export default PlaytimeBadge
