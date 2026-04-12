import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type NetworkContextValue = { online: boolean }

const NetworkContext = createContext<NetworkContextValue>({ online: true })

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  const value = useMemo(() => ({ online }), [online])
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetworkStatus(): NetworkContextValue {
  return useContext(NetworkContext)
}
