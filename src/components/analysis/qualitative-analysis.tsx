"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, Upload, Tags, MessageCircle, FileText, Loader2, AlertCircle, Copy, Check } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { VoiceRecognitionButton } from "@/components/ui/voice-recognition-button"
import { MicrophonePermissionDialog } from "@/components/ui/microphone-permission-dialog"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"

interface QualitativeAnalysisProps {
  projectId: string
  onBack: () => void
}

type QualType = "thematic" | "content" | "coding" | "narrative" | "themes"

const QUAL_TYPES: { value: QualType; label: string; icon: typeof Tags; desc: string }[] = [
  { value: "thematic", label: "Thematic Analysis", icon: Tags, desc: "Identify patterns, codes, and themes in text data" },
  { value: "content", label: "Content Analysis", icon: MessageCircle, desc: "Systematic categorization and frequency analysis" },
  { value: "coding", label: "Open, Axial & Selective Coding", icon: Tags, desc: "Three-level coding for grounded theory" },
  { value: "narrative", label: "Narrative Analysis", icon: FileText, desc: "Analyze structure, characters, and storylines" },
  { value: "themes", label: "Theme Extraction", icon: Tags, desc: "Extract major themes with supporting quotes" },
]

export function QualitativeAnalysis({ projectId, onBack }: QualitativeAnalysisProps) {
  const [inputText, setInputText] = useState("")
  const [analysisType, setAnalysisType] = useState<QualType | null>(null)
  const [researchTopic, setResearchTopic] = useState("")
  const [result, setResult] = useState<string | null>(null)

  const handleVoiceTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setInputText((prev) => {
        const trimmed = prev.trim()
        return trimmed ? `${trimmed} ${text}` : text
      })
    }
  }, [])

  const {
    isListening,
    interimTranscript,
    isSupported,
    permissionDenied,
    setPermissionDenied,
    requestPermission,
    toggleListening,
    stopListening,
    startListening,
  } = useSpeechRecognition({
    onTranscript: handleVoiceTranscript,
  })

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/analysis/qualitative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: analysisType,
          text: inputText,
          researchTopic: researchTopic || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Analysis failed")
      }

      return res.json()
    },
    onSuccess: (data) => {
      if (data?.content) setResult(data.content)
    },
    onError: (err) => {
      setResult(`Error: ${err instanceof Error ? err.message : "Analysis failed"}`)
    },
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      if (text) setInputText(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analysis Selection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Qualitative Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Paste interview transcripts, field notes, or upload text files for AI-powered analysis
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUAL_TYPES.map((qt) => {
              const Icon = qt.icon
              return (
                <button
                  key={qt.value}
                  onClick={() => {
                    setAnalysisType(qt.value)
                    setResult(null)
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                    analysisType === qt.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{qt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{qt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Research Topic (optional)</label>
              <input
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="e.g., Experiences of remote workers during pandemic"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Interview Transcripts / Text Data</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Voice dictation:</span>
                  <VoiceRecognitionButton
                    isListening={isListening}
                    onToggle={permissionDenied ? () => setPermissionDenied(true) : toggleListening}
                    isSupported={isSupported}
                    permissionDenied={permissionDenied}
                    size="sm"
                  />
                </div>
              </div>

              {isListening && (
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg mb-2 text-xs text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="font-semibold shrink-0">Dictating...</span>
                    <span className="text-muted-foreground truncate">
                      {interimTranscript ? `"${interimTranscript}"` : "Speak into your microphone..."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="text-xs font-semibold underline hover:text-red-700 shrink-0"
                  >
                    Done
                  </button>
                </div>
              )}

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Paste your qualitative data here or click the microphone to speak...

Example:
Participant 1: I found the experience to be very challenging at first...
Participant 2: The support system helped me navigate through...
Participant 3: There were both positive and negative aspects...`}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring min-h-[200px] font-mono"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {inputText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <button
              onClick={() => runAnalysis.mutate()}
              disabled={!inputText.trim() || !analysisType || runAnalysis.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {runAnalysis.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                `Run ${analysisType ? QUAL_TYPES.find((q) => q.value === analysisType)?.label : "Analysis"}`
              )}
            </button>
          </div>

          {runAnalysis.isError && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p>{runAnalysis.error instanceof Error ? runAnalysis.error.message : "Analysis failed"}</p>
            </div>
          )}

          {result && (
            <div className="rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Analysis Results
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result)
                    toast.success("Analysis results copied to clipboard")
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <div className="p-6 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>

      <MicrophonePermissionDialog
        isOpen={permissionDenied}
        onClose={() => setPermissionDenied(false)}
        onRetry={async () => {
          const granted = await requestPermission()
          if (granted) {
            setTimeout(() => {
              startListening()
            }, 150)
          }
          return granted
        }}
      />
    </div>
  )
}
