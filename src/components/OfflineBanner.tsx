import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] border-b border-warning/40 bg-warning/15 px-4 py-2.5 text-center text-sm text-text shadow-sm backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-1 sm:flex-row sm:flex-wrap sm:gap-x-3">
        <span className="inline-flex items-center gap-2 font-semibold">
          <WifiOff className="h-4 w-4 shrink-0 text-warning" aria-hidden />
          Mode hors ligne — données en lecture seule
        </span>
        <span className="text-text-muted">Reconnectez-vous pour modifier les données.</span>
      </div>
    </div>
  )
}
