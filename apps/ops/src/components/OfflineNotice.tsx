import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Says so when the phone has no signal: the installed app opens without one, but the figures need the network. */
export default function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <p role="status" className="sticky top-0 z-40 bg-clay px-4 py-2 text-center text-sm font-semibold text-on-clay print:hidden">
      No signal. The figures need the network and will load again when you are back online.
    </p>
  )
}
