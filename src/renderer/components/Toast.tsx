import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useUIStore } from '../store/useUIStore'

const typeClassMap = {
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
  info: 'bg-sky-400',
}

function Toast() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)
  const timerMapRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const activeIds = new Set(toasts.map((toast) => toast.id))

    for (const toast of toasts) {
      if (timerMapRef.current[toast.id]) {
        continue
      }

      timerMapRef.current[toast.id] = window.setTimeout(() => {
        removeToast(toast.id)
        delete timerMapRef.current[toast.id]
      }, 3000)
    }

    for (const [toastId, timer] of Object.entries(timerMapRef.current)) {
      if (activeIds.has(toastId)) {
        continue
      }

      window.clearTimeout(timer)
      delete timerMapRef.current[toastId]
    }

    return () => {
      for (const timer of Object.values(timerMapRef.current)) {
        window.clearTimeout(timer)
      }
      timerMapRef.current = {}
    }
  }, [removeToast, toasts])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="console-panel pointer-events-auto relative overflow-hidden rounded-xl border-white/22 p-3 pr-4 text-sm text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
          >
            <span className={`absolute inset-y-0 left-0 w-[3px] ${typeClassMap[toast.type]}`} />
            <div className="flex items-start justify-between gap-3 pl-1">
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-lg px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white/88"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
