"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import {
  Share2,
  Download,
  BookOpen,
  BookText,
  FlaskConical,
  BarChart3,
  FileText,
  Bookmark,
  FolderOpen,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  MessageSquare,
  Eye,
  FileDown,
  FileType,
  FileIcon,
  Loader2,
  Check,
  Settings,
  Pencil,
} from "lucide-react"
import { ChatArea } from "@/components/chat/chat-area"
import { ChapterNavigation } from "@/components/chapters/chapter-navigation"
import { ResearchPanel } from "@/components/research/research-panel"
import { AnalysisSelector } from "@/components/analysis/analysis-selector"
import { ChapterView } from "@/components/chapters/chapter-view"
import { ManuscriptView } from "@/components/manuscript/manuscript-view"
import { ProjectSettingsModal } from "@/components/research/project-settings-modal"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ChapterNavSkeleton, ResearchPanelSkeleton } from "@/components/ui/loading-skeleton"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Project, ChapterStatus } from "@/types"

const chapters = [
  { number: 1, title: "Introduction", icon: BookOpen },
  { number: 2, title: "Literature Review", icon: BookText },
  { number: 3, title: "Methodology", icon: FlaskConical },
  { number: 4, title: "Data Analysis", icon: BarChart3 },
  { number: 5, title: "Summary & Conclusion", icon: FileText },
  { number: 6, title: "References", icon: Bookmark },
  { number: 7, title: "Appendices", icon: FolderOpen },
]

async function triggerExport(projectId: string, format: "docx" | "html" | "pdf" | "md") {
  const res = await fetch(`/api/export?projectId=${projectId}&format=${format}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Export failed" }))
    throw new Error(err.error || "Export failed")
  }
  const blob = await res.blob()
  const ext = format === "docx" ? "docx" : format === "pdf" ? "pdf" : format === "html" ? "html" : "md"
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `research_project.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ResearchWorkspace() {
  const params = useParams()
  const [activeChapter, setActiveChapter] = useState(1)
  const [view, setView] = useState<"chat" | "generated" | "manuscript">("chat")
  const [showPanel, setShowPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const projectId = params.id as string

  const { data: project } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
    refetchInterval: 30000,
  })

  const chapterStatuses: Record<number, ChapterStatus> = {}
  project?.chapters?.forEach((ch) => {
    chapterStatuses[ch.chapterNumber] = ch.status
  })

  const hasCompleteChapter = project?.chapters?.some((c) => c.status === "COMPLETE" || Boolean(c.content?.trim()))

  useEffect(() => {
    // If user changes active chapter and they were not in manuscript mode, go to chat
    setView((current) => (current === "manuscript" ? "manuscript" : "chat"))
  }, [activeChapter])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleExport = async (format: "docx" | "html" | "pdf" | "md") => {
    setExporting(format)
    setExportOpen(false)
    try {
      await triggerExport(projectId, format)
      toast.success(`${format.toUpperCase()} exported successfully`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate max-w-md">
              {project?.topic || "Research Project"}
            </h2>
            <button
              onClick={() => setShowSettings(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
              title="Project settings"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
            <Sparkles className="h-3 w-3" />
            Saved
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 3-Way Mode Switcher: Chat | Chapter View | Full Manuscript */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <button
              onClick={() => setView("chat")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "chat"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => setView("generated")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "generated"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Chapter View
            </button>
            <button
              onClick={() => setView("manuscript")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "manuscript"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Manuscript (Ch 1 - 5)
            </button>
          </div>

          <button
            onClick={() => setShowPanel((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors xl:hidden"
          >
            {showPanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href)
                toast.success("Project URL copied to clipboard!")
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" />Share
          </button>
          <div className="relative" ref={exportRef}>
            <button
              disabled={!hasCompleteChapter || exporting !== null}
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</>
              ) : (
                <><Download className="h-4 w-4" />Export</>
              )}
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border bg-background shadow-lg z-50 py-1">
                <button
                  onClick={() => handleExport("docx")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <FileDown className="h-4 w-4 text-blue-600" />
                  Export as DOCX (Word)
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <FileIcon className="h-4 w-4 text-red-600" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport("html")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <FileType className="h-4 w-4 text-amber-600" />
                  Export as HTML
                </button>
                <button
                  onClick={() => handleExport("md")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Export as Markdown (.md)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" data-chapter-nav>
        <ErrorBoundary>
          <ChapterNavigation
            chapters={chapters}
            activeChapter={activeChapter}
            onSelect={(num) => {
              setActiveChapter(num)
              setView("chat")
            }}
            chapterStatuses={chapterStatuses}
            isManuscriptView={view === "manuscript"}
            onSelectManuscript={() => setView("manuscript")}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            {view === "manuscript" ? (
              <ManuscriptView
                projectId={projectId}
                onSelectChapter={(num) => {
                  setActiveChapter(num)
                  setView("chat")
                }}
              />
            ) : activeChapter === 4 && view === "chat" ? (
              <AnalysisSelector projectId={projectId} />
            ) : view === "generated" ? (
              <div className="flex-1 overflow-y-auto p-6">
                <ChapterView projectId={projectId} chapterNumber={activeChapter} />
              </div>
            ) : (
              <ChatArea projectId={projectId} chapterNumber={activeChapter} />
            )}
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className={cn("xl:block", showPanel ? "block" : "hidden")}>
            <ResearchPanel
              projectId={projectId}
              onExport={handleExport}
              exporting={exporting}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        </ErrorBoundary>
      </div>

      {showSettings && project && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
