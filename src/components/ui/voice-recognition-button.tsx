"use client"

import { Mic, MicOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecognitionButtonProps {
  isListening: boolean
  onToggle: () => void
  isSupported?: boolean
  permissionDenied?: boolean
  className?: string
  title?: string
  size?: "sm" | "md" | "lg"
}

export function VoiceRecognitionButton({
  isListening,
  onToggle,
  isSupported = true,
  permissionDenied = false,
  className,
  title,
  size = "md",
}: VoiceRecognitionButtonProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-10 w-10 text-base",
  }

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={
        title ||
        (!isSupported
          ? "Voice recognition not supported in this browser"
          : permissionDenied
          ? "Microphone access blocked. Click to view how to allow permission."
          : isListening
          ? "Listening... Click to stop voice input"
          : "Click to speak (Voice-to-Text)")
      }
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg transition-all focus:outline-none shrink-0",
        sizeClasses[size],
        isListening
          ? "bg-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600 animate-pulse"
          : permissionDenied
          ? "border border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
          : "border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        !isSupported && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {isListening ? (
        <>
          <span className="absolute -inset-1 rounded-lg bg-red-400 opacity-75 animate-ping -z-10" />
          <Mic className={cn(iconSizes[size], "animate-bounce")} />
        </>
      ) : permissionDenied ? (
        <AlertCircle className={cn(iconSizes[size], "text-amber-600 dark:text-amber-400")} />
      ) : isSupported ? (
        <Mic className={iconSizes[size]} />
      ) : (
        <MicOff className={iconSizes[size]} />
      )}
    </button>
  )
}
