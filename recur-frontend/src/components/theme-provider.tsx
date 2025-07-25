

import * as React from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function PostHogThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "posthog-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => (localStorage?.getItem(storageKey) as Theme) || defaultTheme)

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage?.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

// Wrapper component that syncs theme with user settings
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  
  React.useEffect(() => {
    // Load theme from user settings if available
    const storedUserSettings = localStorage.getItem('userSettings');
    if (storedUserSettings) {
      try {
        const settings = JSON.parse(storedUserSettings);
        if (settings.theme && settings.theme !== theme) {
          setTheme(settings.theme);
        }
      } catch (error) {
        console.warn('Failed to parse user settings from localStorage:', error);
      }
    }
  }, [theme, setTheme]);

  return <>{children}</>;
}
