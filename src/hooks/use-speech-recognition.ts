"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface UseSpeechRecognitionOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

export function useSpeechRecognition({
  onTranscript,
  continuous = true,
  interimResults = true,
  lang = "en-US",
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<any>(null)
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang = lang

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
          setPermissionDenied(false)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentInterim = ""
          let currentFinal = ""

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i]
            if (result.isFinal) {
              currentFinal += result[0].transcript
            } else {
              currentInterim += result[0].transcript
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const updated = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()
              onTranscriptRef.current?.(currentFinal.trim(), true)
              return updated
            })
          }

          setInterimTranscript(currentInterim)
          if (currentInterim && !currentFinal) {
            onTranscriptRef.current?.(currentInterim, false)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("[SpeechRecognition] Error:", event.error)
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setError("Microphone permission denied.")
            setPermissionDenied(true)
            setIsListening(false)
          } else if (event.error === "no-speech") {
            // benign - no speech detected within timeout, don't crash
          } else if (event.error !== "aborted") {
            setError(`Speech recognition notice: ${event.error}`)
            setIsListening(false)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript("")
        }

        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [continuous, interimResults, lang])

  /**
   * Request microphone permission explicitly via getUserMedia to prompt the browser dialog.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately release tracks so mic is freed for SpeechRecognition
        stream.getTracks().forEach((track) => track.stop())
        setPermissionDenied(false)
        setError(null)
        return true
      } catch (err: any) {
        console.warn("[SpeechRecognition] getUserMedia denied:", err?.name)
        setPermissionDenied(true)
        setError("Microphone permission denied by browser.")
        return false
      }
    }
    return true
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      toast.info(
        "Voice recognition is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari."
      )
      return
    }

    if (recognitionRef.current && !isListening) {
      setError(null)

      // Test or prompt for microphone access via getUserMedia first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach((t) => t.stop())
          setPermissionDenied(false)
        } catch (err: any) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setPermissionDenied(true)
            setError("Microphone access denied. Please check your browser permissions.")
            return
          }
        }
      }

      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast.info("Listening... Speak clearly into your microphone.", { duration: 2500 })
      } catch (err: any) {
        console.warn("[SpeechRecognition] Start error, retrying with reset:", err)
        try {
          recognitionRef.current.abort()
          setTimeout(() => {
            try {
              recognitionRef.current?.start()
              setIsListening(true)
            } catch {
              setPermissionDenied(true)
            }
          }, 120)
        } catch {
          setError("Failed to start voice recognition.")
        }
      }
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
      setInterimTranscript("")
    }
  }, [isListening])

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }, [isListening, startListening, stopListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    permissionDenied,
    setPermissionDenied,
    requestPermission,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  }
}
