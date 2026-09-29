"use client"

import { useState, useEffect } from "react"
import {
  Mic,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  Laptop,
  Compass,
  Globe,
  Settings as SettingsIcon,
  HelpCircle,
  Volume2
} from "lucide-react"

interface MicrophonePermissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => Promise<boolean>
}

type BrowserTab = "chrome" | "safari" | "firefox" | "edge" | "system"

export function MicrophonePermissionDialog({
  isOpen,
  onClose,
  onRetry,
}: MicrophonePermissionDialogProps) {
  const [activeTab, setActiveTab] = useState<BrowserTab>("chrome")
  const [isRetrying, setIsRetrying] = useState(false)
  const [retrySuccess, setRetrySuccess] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [detectedBrowser, setDetectedBrowser] = useState<BrowserTab>("chrome")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase()
      if (ua.includes("edg/")) {
        setActiveTab("edge")
        setDetectedBrowser("edge")
      } else if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")) {
        setActiveTab("safari")
        setDetectedBrowser("safari")
      } else if (ua.includes("firefox")) {
        setActiveTab("firefox")
        setDetectedBrowser("firefox")
      } else {
        setActiveTab("chrome")
        setDetectedBrowser("chrome")
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryError(null)
    try {
      const ok = await onRetry()
      if (ok) {
        setRetrySuccess(true)
        setTimeout(() => {
          setRetrySuccess(false)
          onClose()
        }, 1200)
      } else {
        setRetryError("Microphone permission is still blocked. Follow the steps below and try again.")
      }
    } catch (err: any) {
      setRetryError(err?.message || "Failed to access microphone.")
    } finally {
      setIsRetrying(false)
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl text-card-foreground max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Troubleshoot Microphone Access</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enable browser permissions to dictate prompts & research content
            </p>
          </div>
        </div>

        {/* Browser Selector Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("chrome")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "chrome"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Chrome</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("safari")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "safari"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Safari</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edge")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "edge"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Edge</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("firefox")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "firefox"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Firefox</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "system"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>OS</span>
          </button>
        </div>

        {/* Tab Instructions Content */}
        <div className="space-y-2.5 rounded-xl border bg-muted/40 p-4 mb-4 text-xs">
          {activeTab === "chrome" && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  1
                </span>
                <p className="leading-snug">
                  Click the <strong>Tune / Settings icon 🎛️</strong> or <strong>Lock 🔒</strong> located immediately to the <strong>left of the URL</strong> in your address bar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  2
                </span>
                <p className="leading-snug">
                  Toggle <strong>Microphone</strong> to <strong>Allow</strong> (or switch from <em>Blocked</em> to <em>Allowed</em>).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  3
                </span>
                <p className="leading-snug">
                  If prompted, click <strong>Reload</strong> to refresh permissions, or click the <strong>Test & Request Access</strong> button below.
                </p>
              </div>
            </>
          )}

          {activeTab === "safari" && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  1
                </span>
                <p className="leading-snug">
                  In the Mac menu bar at top, click <strong>Safari → Settings for This Website...</strong> (or press <strong>Cmd + ,</strong> → Websites).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  2
                </span>
                <p className="leading-snug">
                  Next to <strong>Microphone</strong>, change the dropdown from <em>Deny</em> or <em>Ask</em> to <strong>Allow</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  3
                </span>
                <p className="leading-snug">
                  On iPhone/iPad: Open <strong>iOS Settings → Safari → Microphone → Allow</strong>.
                </p>
              </div>
            </>
          )}

          {activeTab === "edge" && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  1
                </span>
                <p className="leading-snug">
                  Click the <strong>Lock icon 🔒</strong> in Edge&apos;s address bar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  2
                </span>
                <p className="leading-snug">
                  Click <strong>Permissions for this site</strong> or toggle <strong>Microphone</strong> directly to <strong>Allow</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  3
                </span>
                <p className="leading-snug">
                  Click <strong>Test & Request Access</strong> below to initiate voice dictation.
                </p>
              </div>
            </>
          )}

          {activeTab === "firefox" && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  1
                </span>
                <p className="leading-snug">
                  Click the <strong>Microphone with red slash 🎙️🚫</strong> icon next to the address bar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  2
                </span>
                <p className="leading-snug">
                  Click the <strong>&apos;X&apos;</strong> next to <em>Blocked Temporarily</em> to clear the block.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  3
                </span>
                <p className="leading-snug">
                  Click <strong>Test & Request Access</strong> and select <strong>&quot;Remember this decision&quot;</strong> on the popup.
                </p>
              </div>
            </>
          )}

          {activeTab === "system" && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  Mac
                </span>
                <p className="leading-snug">
                  Open <strong>System Settings → Privacy & Security → Microphone</strong>. Ensure your browser (Chrome/Safari/Firefox) has permission enabled.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  Win
                </span>
                <p className="leading-snug">
                  Open <strong>Settings → Privacy & security → Microphone</strong>. Turn on <em>Microphone access</em> and <em>Let desktop apps access your microphone</em>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Preview Iframe Warning / Workaround */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 mb-4 text-xs text-muted-foreground flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Using in a Preview Frame?</p>
            <p className="leading-relaxed">
              If your application is embedded within an IDE preview window or iframe, browser security may restrict microphone access to top-level domains. Opening in a direct tab immediately triggers the native permission prompt.
            </p>
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline pt-0.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open app in a new tab
              </a>
            )}
          </div>
        </div>

        {retrySuccess && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-xs font-semibold text-green-600 dark:text-green-400 mb-3 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Microphone access successfully granted!
          </div>
        )}

        {retryError && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs font-medium text-destructive mb-3 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{retryError}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Requesting Permission..." : "Test & Request Access"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
