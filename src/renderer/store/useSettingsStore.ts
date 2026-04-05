import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Settings } from '../types/settings'

interface SettingsState {
  settings: Settings
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  setAccentColor: (accentColor: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const storedSettings = await window.launcher?.store.getSettings()
    set({
      settings: {
        ...DEFAULT_SETTINGS,
        ...(storedSettings ?? {}),
      },
      hydrated: true,
    })
  },

  updateSettings: async (patch) => {
    const nextSettings = {
      ...get().settings,
      ...patch,
    }

    set({ settings: nextSettings })
    const saved = await window.launcher?.store.setSettings(nextSettings)
    set({ settings: saved ?? nextSettings })
  },

  setAccentColor: async (accentColor) => {
    await get().updateSettings({ accentColor })
  },
}))
