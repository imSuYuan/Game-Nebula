import { useEffect, useRef, useState } from 'react'
import SafeImage from './SafeImage'

interface GlobalBackgroundProps {
  imagePath: string | null
}

const FADE_DURATION_MS = 500

function GlobalBackground({ imagePath }: GlobalBackgroundProps) {
  const [currentBg, setCurrentBg] = useState<string | null>(imagePath)
  const [prevBg, setPrevBg] = useState<string | null>(null)
  const [isPrevVisible, setIsPrevVisible] = useState(false)
  const [isCurrentVisible, setIsCurrentVisible] = useState(true)
  const frameTimerRef = useRef<number | null>(null)
  const cleanupTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (imagePath === currentBg) {
      return
    }

    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    setPrevBg(currentBg)
    setIsPrevVisible(Boolean(currentBg))
    setCurrentBg(imagePath)
    setIsCurrentVisible(false)

    frameTimerRef.current = window.setTimeout(() => {
      setIsPrevVisible(false)
      setIsCurrentVisible(true)
      frameTimerRef.current = null
    }, 16)

    cleanupTimerRef.current = window.setTimeout(() => {
      setPrevBg(null)
      cleanupTimerRef.current = null
    }, FADE_DURATION_MS)

    return () => {
      if (frameTimerRef.current) {
        window.clearTimeout(frameTimerRef.current)
        frameTimerRef.current = null
      }

      if (cleanupTimerRef.current) {
        window.clearTimeout(cleanupTimerRef.current)
        cleanupTimerRef.current = null
      }
    }
  }, [imagePath, currentBg])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f0f1a,#1a1a2e,#16213e)]" />

      {prevBg ? (
        <SafeImage
          path={prevBg}
          alt=""
          ariaHidden
          className={`absolute inset-0 h-full w-full object-cover object-center brightness-[0.62] transition-opacity duration-[500ms] ease-in-out ${
            isPrevVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {currentBg ? (
        <SafeImage
          path={currentBg}
          alt=""
          ariaHidden
          className={`absolute inset-0 h-full w-full object-cover object-center brightness-[0.62] transition-opacity duration-[500ms] ease-in-out ${
            isCurrentVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0.16)_50%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  )
}

export default GlobalBackground
