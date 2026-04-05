import { formatDistanceToNowStrict } from 'date-fns'

export function formatPlaytime(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60

  if (!hours) {
    return `${minutes}分钟`
  }

  if (!minutes) {
    return `${hours}小时`
  }

  return `${hours}小时 ${minutes}分钟`
}

export function formatLastPlayed(lastPlayed: string | null): string {
  if (!lastPlayed) {
    return '从未游玩'
  }

  try {
    return `${formatDistanceToNowStrict(new Date(lastPlayed), { addSuffix: true })}`
  } catch {
    return '时间未知'
  }
}
