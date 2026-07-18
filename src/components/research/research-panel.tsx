"use client"

import { BookOpen, Target, BarChart3, Download, CheckCircle2, Circle, Loader2, FileDown, FileType, FileIcon, Pencil } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import type { Project, Chapter } from "@/types"

interface ResearchPanelProps {
  projectId: string
  onExport?: (format: "docx" | "html" | "pdf") => void
  exporting?: string | null
  onOpenSettings?: () => void
}

export function ResearchPanel({ projectId, onExport, exporting, onOpenSettings }: ResearchPanelProps) {
  const { data: project } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
    refetchInterval: 30000,
  })

  const chapters: Chapter[] = project?.chapters || []
  const completedChapters = chapters.filter((c) => c.status === "COMPLETE").length
  const generatingChapters = chapters.filter((c) => c.status === "GENERATING").length

  const methodologyLabel = project?.methodology?.replace(/_/g, " ") || "Not set"
  const levelLabel = project?.academicLevel || "Not set"
  const citationLabel = project?.citationStyle || "Not set"

  const wordCount = chapters.reduce((acc: number, ch: Chapter) => {
    return acc + (ch.content?.split(/\s+/).filter(Boolean).length || 0)
  }, 0)

  const chapterList = [
    { num: 1, title: "Introduction" },
    { num: 2, title: "Literature Review" },
    { num: 3, title: "Methodology" },
    { num: 4, title: "Data Analysis" },
    { num: 5, title: "Conclusion" },
  ]

  const statusIcon = (status?: string) => {
    if (status === "COMPLETE") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
    if (status === "GENERATING") return <Loader2 className="h-3.5 w-3.5 shrink-0 text-yellow-500 animate-spin" />
    return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
  }

  return (
    <aside className="w-72 border-l bg-muted/20 p-4 overflow-y-auto hidden xl:block shrink-0">
      <div className="space-y-6">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            Research Overview
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Topic</p>
              <p className="font-medium text-sm leading-snug mt-0.5">
                {project?.topic || "Loading..."}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Methodology</span>
              <span className="font-medium text-right max-w-[140px]">{methodologyLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="font-medium">{levelLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Citation</span>
              <span className="font-medium">{citationLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Word Count</span>
              <span className="font-medium">{wordCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            Chapter Progress
          </h3>
          <div className="space-y-2">
            {chapterList.map((ch) => {
              const chapter = chapters.find((c) => c.chapterNumber === ch.num)
              return (
                <div key={ch.num} className="flex items-center gap-2 text-sm">
                  {statusIcon(chapter?.status)}
                  <span
                    className={cn(
                      chapter?.status === "COMPLETE" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Ch. {ch.num} {ch.title}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 flex-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(completedChapters / 5) * 100}%` }}
              />
            </div>
            <span className="shrink-0">
              {completedChapters}/5
              {generatingChapters > 0 && ` (+${generatingChapters})`}
            </span>
          </div>
        </div>

        <div>
          <h3 className="flex items-center justify-between text-sm font-semibold mb-3">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Research Details
            </span>
            <button
              onClick={onOpenSettings}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors"
              title="Edit details"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium">{project?.department || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Institution</p>
              <p className="font-medium">{project?.institution || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="font-medium">{project?.country || "-"}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Download className="h-4 w-4 text-primary" />
            Export
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onExport?.("pdf")}
              disabled={completedChapters === 0 || exporting !== null}
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileIcon className="h-4 w-4" />
              )}
              Export as PDF
            </button>
            <button
              onClick={() => onExport?.("docx")}
              disabled={completedChapters === 0 || exporting !== null}
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === "docx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Export as DOCX
            </button>
            <button
              onClick={() => onExport?.("html")}
              disabled={completedChapters === 0 || exporting !== null}
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === "html" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileType className="h-4 w-4" />
              )}
              Export as HTML
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
