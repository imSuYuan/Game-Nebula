import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface UIState {
  selectedGameId: string | null
  activeRoute: 'library' | 'favorites' | 'recent' | 'settings'
  isAddGameModalOpen: boolean
  toasts: ToastMessage[]
  setSelectedGameId: (gameId: string | null) => void
  setActiveRoute: (route: UIState['activeRoute']) => void
  setAddGameModalOpen: (open: boolean) => void
  pushToast: (toast: ToastMessage) => void
  removeToast: (toastId: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedGameId: null,
  activeRoute: 'library',
  isAddGameModalOpen: false,
  toasts: [],

  setSelectedGameId: (selectedGameId) => set({ selectedGameId }),

  setActiveRoute: (activeRoute) => set({ activeRoute }),

  setAddGameModalOpen: (isAddGameModalOpen) => set({ isAddGameModalOpen }),

  pushToast: (toast) => {
    set((state) => {
      const next = [...state.toasts, toast]
      return { toasts: next.slice(-5) }
    })
  },

  removeToast: (toastId) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== toastId) }))
  },
}))
