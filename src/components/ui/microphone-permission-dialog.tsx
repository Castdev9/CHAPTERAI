"use client"

import { useState } from "react"
import { Mic, AlertTriangle, X, RefreshCw, CheckCircle2, ShieldAlert, ExternalLink } from "lucide-react"

interface MicrophonePermissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => Promise<boolean>
}

export function MicrophonePermissionDialog({
  isOpen,
  onClose,
  onRetry,
}: MicrophonePermissionDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retrySuccess, setRetrySuccess] = useState(false)

  if (!isOpen) return null

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const ok = await onRetry()
      if (ok) {
        setRetrySuccess(true)
        setTimeout(() => {
          setRetrySuccess(false)
          onClose()
        }, 1200)
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl text-card-foreground">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">Microphone Access Blocked</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browser permission is required for voice-to-text
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Your browser or preview container blocked access to the microphone. Follow these quick steps to enable it:
        </p>

        <div className="space-y-2.5 rounded-xl border bg-muted/40 p-3.5 mb-5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              1
            </span>
            <p className="leading-snug">
              Look at the <strong>address bar</strong> at the top of your browser (next to the URL).
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              2
            </span>
            <p className="leading-snug">
              Click the <strong>🔒 Padlock</strong> or <strong>🎛️ Site Settings</strong> icon.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              3
            </span>
            <p className="leading-snug">
              Find <strong>Microphone</strong> and set it from <em>Block</em> to <strong>Allow</strong>.
            </p>
          </div>
        </div>

        {retrySuccess ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-xs font-medium text-green-600 dark:text-green-400 mb-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Microphone access granted! Starting voice input...
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Testing Microphone..." : "Try Again (Request Access)"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-4 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Type Manually
              </button>
            </div>

            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full text-center text-[11px] text-muted-foreground hover:text-foreground pt-1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open app in direct tab (if preview iframe restricts microphone)
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
