import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
  modal: { id: string; data?: unknown } | null
  pushToast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
  openModal: (id: string, data?: unknown) => void
  closeModal: () => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

let toastCounter = 0

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarOpen: false,
  modal: null,
  pushToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${toastCounter++}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  openModal: (id, data) => set({ modal: { id, data } }),
  closeModal: () => set({ modal: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}))
