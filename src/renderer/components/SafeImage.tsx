import { memo, useEffect, useState } from 'react'

interface SafeImageProps {
  path: string | null | undefined
  alt: string
  className?: string
  ariaHidden?: boolean
}

const srcCache = new Map<string, string>()
const pendingLoads = new Map<string, Promise<string>>()

function isRemoteLike(pathValue: string): boolean {
  return /^(https?:|data:|blob:|file:)/i.test(pathValue)
}

function normalizeToFileUrl(pathValue: string): string {
  const normalized = pathValue.replace(/\\/g, '/')
  return /^[a-zA-Z]:\//.test(normalized) ? `file:///${normalized}` : normalized
}

async function resolveImageSrc(pathValue: string): Promise<string> {
  if (isRemoteLike(pathValue)) {
    return pathValue
  }

  const cached = srcCache.get(pathValue)
  if (cached) {
    return cached
  }

  const pending = pendingLoads.get(pathValue)
  if (pending) {
    return pending
  }

  const loadPromise = (async () => {
    const dataUrl = await window.launcher?.file.readAsDataUrl({ filePath: pathValue })
    const resolved = dataUrl || normalizeToFileUrl(pathValue)
    srcCache.set(pathValue, resolved)
    pendingLoads.delete(pathValue)
    return resolved
  })()

  pendingLoads.set(pathValue, loadPromise)
  return loadPromise
}

export async function preloadSafeImagePath(path: string | null | undefined): Promise<void> {
  if (!path) {
    return
  }

  await resolveImageSrc(path)
}

function SafeImage({ path, alt, className, ariaHidden }: SafeImageProps) {
  const [src, setSrc] = useState<string>('')

  useEffect(() => {
    let active = true

    if (!path) {
      setSrc('')
      return () => {
        active = false
      }
    }

    const load = async () => {
      const resolvedSrc = await resolveImageSrc(path)
      if (!active) {
        return
      }

      setSrc(resolvedSrc)
    }

    void load()

    return () => {
      active = false
    }
  }, [path])

  if (!src) {
    return null
  }

  return <img src={src} alt={alt} className={className} aria-hidden={ariaHidden} loading="lazy" decoding="async" draggable={false} />
}

export default memo(SafeImage)
