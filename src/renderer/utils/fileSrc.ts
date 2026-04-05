export function toFileSrc(pathValue: string | null | undefined): string {
  if (!pathValue) {
    return ''
  }

  if (/^(https?:|data:|blob:|file:)/i.test(pathValue)) {
    return pathValue
  }

  const normalized = pathValue.replace(/\\/g, '/')

  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`
  }

  if (normalized.startsWith('/')) {
    return `file://${normalized}`
  }

  return pathValue
}
