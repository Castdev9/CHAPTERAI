"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Loader2, Sparkles, Copy, Check, BookOpen } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import type { Chapter } from "@/types"

interface ChapterViewProps {
  projectId: string
  chapterNumber: number
  onStartWriting?: () => void
}

export function ChapterView({ projectId, chapterNumber, onStartWriting }: ChapterViewProps) {
  const [copied, setCopied] = useState(false)

  const { data: chapters = [], isLoading } = useQuery<Chapter[]>({
    queryKey: ["chapters", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.chapters || []
    },
  })

  const chapter = chapters.find((c) => c.chapterNumber === chapterNumber)

  const handleCopy = () => {
    if (!chapter?.content) return
    navigator.clipboard.writeText(chapter.content)
    setCopied(true)
    toast.success("Chapter text copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs">Loading chapter...</span>
      </div>
    )
  }

  if (!chapter || !chapter.content) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-base">Chapter {chapterNumber} Not Generated Yet</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
          {chapter?.title ? `${chapter.title} has no content drafted.` : "This chapter has not been drafted yet."}{" "}
          You can generate it using the AI research assistant in the Chat tab or the Manuscript view.
        </p>
      </div>
    )
  }

  const wordCount = chapter.content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="border-b bg-muted/40 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            Chapter {chapter.chapterNumber}: {chapter.title}
          </span>
          {chapter.status === "GENERATING" && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </span>
          )}
          {chapter.status === "COMPLETE" && (
            <span className="text-xs text-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Complete
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            ({wordCount.toLocaleString()} words)
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          title="Copy chapter markdown"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="p-8 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{chapter.content}</Markdown>
      </div>
    </div>
  )
}
