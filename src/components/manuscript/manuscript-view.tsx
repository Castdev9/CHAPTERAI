"use client"

import { useState, useRef, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Download,
  FileDown,
  FileType,
  FileIcon,
  Printer,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Pencil,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  AlignLeft,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Project, Chapter } from "@/types"

interface ManuscriptViewProps {
  projectId: string
  onSelectChapter?: (chapterNumber: number) => void
}

const CHAPTER_TITLES: Record<number, string> = {
  1: "Introduction",
  2: "Literature Review",
  3: "Research Methodology",
  4: "Data Analysis and Presentation of Results",
  5: "Summary, Conclusions and Recommendations",
  6: "References",
  7: "Appendices",
}

export function ManuscriptView({ projectId, onSelectChapter }: ManuscriptViewProps) {
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedChapter, setCopiedChapter] = useState<number | null>(null)
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null)
  const [fontSerif, setFontSerif] = useState(true)
  const [doubleSpaced, setDoubleSpaced] = useState(false)
  const [collapsedChapters, setCollapsedChapters] = useState<Record<number, boolean>>({})

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
    refetchInterval: 15000,
  })

  const chapters: Chapter[] = useMemo(() => {
    return project?.chapters || []
  }, [project])

  // Core 1-5 chapters arranged in order
  const orderedChapters = useMemo(() => {
    const list: { number: number; title: string; chapter?: Chapter }[] = []
    for (let i = 1; i <= 5; i++) {
      const found = chapters.find((c) => c.chapterNumber === i)
      list.push({
        number: i,
        title: found?.title || CHAPTER_TITLES[i] || `Chapter ${i}`,
        chapter: found,
      })
    }
    // Check if references (6) exists
    const refCh = chapters.find((c) => c.chapterNumber === 6 && c.content?.trim())
    if (refCh) {
      list.push({
        number: 6,
        title: "References",
        chapter: refCh,
      })
    }
    return list
  }, [chapters])

  // Statistics
  const totalWordCount = useMemo(() => {
    return chapters.reduce((sum, ch) => {
      const words = ch.content ? ch.content.split(/\s+/).filter(Boolean).length : 0
      return sum + words
    }, 0)
  }, [chapters])

  const completedCount = useMemo(() => {
    return orderedChapters.filter((c) => c.chapter?.content?.trim() && c.chapter.status === "COMPLETE").length
  }, [orderedChapters])

  const progressPercent = Math.round((completedCount / 5) * 100)
  const readingTimeMin = Math.ceil(totalWordCount / 220)

  // Download Trigger
  const handleExport = async (format: "docx" | "pdf" | "html" | "md") => {
    setExporting(format)
    try {
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
      const topicSafe = (project?.topic || "research_project").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)
      a.download = `${topicSafe}_manuscript.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} downloaded successfully!`)
    } catch (err: any) {
      toast.error(err.message || "Failed to download manuscript")
    } finally {
      setExporting(null)
    }
  }

  // Copy full manuscript
  const handleCopyFullManuscript = async () => {
    if (!project) return
    let text = `# ${project.topic}\n\n`
    text += `Academic Level: ${project.academicLevel}\n`
    text += `Department: ${project.department}\n`
    text += `Institution: ${project.institution}, ${project.country}\n`
    text += `Citation Style: ${project.citationStyle}\n\n`
    text += `---\n\n`

    orderedChapters.forEach((item) => {
      text += `# Chapter ${item.number}: ${item.title}\n\n`
      text += (item.chapter?.content || "*Chapter not yet drafted.*") + "\n\n---\n\n"
    })

    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      toast.success("Complete manuscript copied to clipboard")
      setTimeout(() => setCopiedAll(false), 2500)
    } catch {
      toast.error("Failed to copy manuscript")
    }
  }

  const handleCopyChapter = async (chapterNumber: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedChapter(chapterNumber)
      toast.success(`Chapter ${chapterNumber} copied`)
      setTimeout(() => setCopiedChapter(null), 2000)
    } catch {
      toast.error("Failed to copy chapter")
    }
  }

  // In-place edit chapter
  const handleStartEdit = (chapterNumber: number, content: string) => {
    setEditingChapter(chapterNumber)
    setEditContent(content)
  }

  const handleSaveEdit = async (chapterNumber: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chapters/${chapterNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          status: "COMPLETE",
        }),
      })

      if (!res.ok) throw new Error("Failed to save chapter edits")

      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      setEditingChapter(null)
      toast.success(`Chapter ${chapterNumber} updated successfully`)
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    }
  }

  // Generate missing chapter
  const handleGenerateChapter = async (chapterNumber: number) => {
    setGeneratingChapter(chapterNumber)
    try {
      const res = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterNumber }),
      })

      if (!res.ok) {
        throw new Error("Failed to initiate chapter generation")
      }

      toast.info(`Generating Chapter ${chapterNumber}...`)
      // Refresh project to poll status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] })
        setGeneratingChapter(null)
      }, 3000)
    } catch (err: any) {
      toast.error(err.message || "Failed to generate chapter")
      setGeneratingChapter(null)
    }
  }

  const toggleCollapse = (num: number) => {
    setCollapsedChapters((prev) => ({ ...prev, [num]: !prev[num] }))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading manuscript...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Top Action & Control Bar */}
      <div className="border-b bg-card px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h2 className="text-base font-bold text-foreground">
              Complete Academic Manuscript (Chapters 1 – 5)
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{completedCount} of 5 Chapters Complete ({progressPercent}%)</span>
              <span>•</span>
              <span>{totalWordCount.toLocaleString()} words</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{readingTimeMin} min read
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Format toggles */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40 text-xs mr-2">
            <button
              onClick={() => setFontSerif(true)}
              className={cn(
                "px-2.5 py-1 rounded-md font-serif transition-colors",
                fontSerif ? "bg-background shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Serif Academic Font (Times style)"
            >
              Serif
            </button>
            <button
              onClick={() => setFontSerif(false)}
              className={cn(
                "px-2.5 py-1 rounded-md font-sans transition-colors",
                !fontSerif ? "bg-background shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Sans-Serif Modern Font"
            >
              Sans
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={() => setDoubleSpaced((v) => !v)}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                doubleSpaced ? "bg-background shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Toggle Academic Double Spacing"
            >
              {doubleSpaced ? "2.0x Spacing" : "1.5x Spacing"}
            </button>
          </div>

          <button
            onClick={handleCopyFullManuscript}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            {copiedAll ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            {copiedAll ? "Copied All" : "Copy Full Text"}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            title="Print Manuscript"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            Print
          </button>

          {/* Download Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport("docx")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              {exporting === "docx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              DOCX
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-xs disabled:opacity-50"
            >
              {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileIcon className="h-3.5 w-3.5 text-red-500" />}
              PDF
            </button>
            <button
              onClick={() => handleExport("md")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-xs disabled:opacity-50"
            >
              {exporting === "md" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType className="h-3.5 w-3.5 text-blue-500" />}
              MD
            </button>
          </div>
        </div>
      </div>

      {/* Manuscript Content Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
        <div
          className={cn(
            "max-w-4xl mx-auto space-y-12 transition-all",
            fontSerif ? "font-serif" : "font-sans",
            doubleSpaced ? "leading-loose" : "leading-relaxed"
          )}
        >
          {/* Formal Dissertation Cover / Title Page */}
          <section
            id="title-page"
            className="rounded-2xl border bg-card p-10 md:p-16 text-center space-y-8 shadow-xs border-dashed"
          >
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-medium">
                Academic Research Manuscript
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-foreground max-w-2xl mx-auto">
                {project?.topic || "Research Project Topic"}
              </h1>
            </div>

            <div className="w-16 h-0.5 bg-primary/40 mx-auto" />

            <div className="space-y-2 text-sm text-foreground/80 font-sans">
              <p className="font-semibold text-foreground">
                A Thesis Submitted in Partial Fulfillment of the Requirements for the Degree of
              </p>
              <p className="font-bold text-primary">
                {project?.academicLevel ? `${project.academicLevel} DEGREE` : "MASTER OF SCIENCE"}
              </p>
              <p className="text-muted-foreground">Department of {project?.department || "Academic Studies"}</p>
              <p className="text-muted-foreground">
                {project?.institution || "University"}, {project?.country || ""}
              </p>
            </div>

            <div className="pt-4 border-t border-border/60 text-xs text-muted-foreground font-sans flex flex-wrap justify-center gap-6">
              <span>Citation Standard: <strong className="text-foreground">{project?.citationStyle || "APA"}</strong></span>
              <span>Methodology: <strong className="text-foreground">{project?.methodology?.replace(/_/g, " ") || "Mixed Methods"}</strong></span>
              <span>Total Length: <strong className="text-foreground">{totalWordCount.toLocaleString()} words</strong></span>
            </div>
          </section>

          {/* Table of Contents Box */}
          <section className="rounded-xl border bg-muted/20 p-6 font-sans space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Table of Contents
              </h3>
              <span className="text-xs text-muted-foreground">Chapters 1 to 5</span>
            </div>

            <div className="space-y-2.5 text-sm">
              {orderedChapters.map((item) => {
                const words = item.chapter?.content ? item.chapter.content.split(/\s+/).filter(Boolean).length : 0
                const isComplete = item.chapter?.status === "COMPLETE" && item.chapter.content?.trim()
                const isGenerating = item.chapter?.status === "GENERATING" || generatingChapter === item.number

                return (
                  <div key={item.number} className="flex items-center justify-between gap-4 py-1 hover:bg-muted/40 px-2 rounded-md transition-colors">
                    <a
                      href={`#chapter-${item.number}`}
                      className="font-medium text-foreground hover:text-primary transition-colors truncate flex items-center gap-2"
                    >
                      <span className="font-mono text-xs text-primary font-semibold">
                        Chapter {item.number}:
                      </span>
                      <span className="truncate">{item.title}</span>
                    </a>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="font-mono text-muted-foreground">{words.toLocaleString()} words</span>
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </span>
                      ) : isGenerating ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating...
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Sequential Arranged Chapters 1 to 5 */}
          {orderedChapters.map((item) => {
            const hasContent = Boolean(item.chapter?.content?.trim())
            const isEditing = editingChapter === item.number
            const isCollapsed = collapsedChapters[item.number] || false
            const isGenerating = item.chapter?.status === "GENERATING" || generatingChapter === item.number

            return (
              <article
                key={item.number}
                id={`chapter-${item.number}`}
                className="rounded-2xl border bg-card shadow-xs overflow-hidden transition-all scroll-mt-20"
              >
                {/* Chapter Academic Header */}
                <div className="border-b bg-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-3 font-sans">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleCollapse(item.number)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                        Chapter {item.number}
                      </span>
                      <h3 className="font-bold text-lg text-foreground truncate">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasContent && (
                      <>
                        <button
                          onClick={() => handleCopyChapter(item.number, item.chapter!.content)}
                          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Copy Chapter Markdown"
                        >
                          {copiedChapter === item.number ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy
                        </button>
                        <button
                          onClick={() => isEditing ? setEditingChapter(null) : handleStartEdit(item.number, item.chapter!.content)}
                          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Edit Chapter Text"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {isEditing ? "Close Editor" : "Edit"}
                        </button>
                      </>
                    )}

                    {onSelectChapter && (
                      <button
                        onClick={() => onSelectChapter(item.number)}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80 transition-colors"
                      >
                        Open Workspace
                      </button>
                    )}
                  </div>
                </div>

                {/* Chapter Body or In-place Editor */}
                {!isCollapsed && (
                  <div className="p-6 md:p-10">
                    {isEditing ? (
                      <div className="space-y-4 font-sans">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Editing Chapter {item.number} Content (Markdown supported)</span>
                          <span>{editContent.split(/\s+/).filter(Boolean).length} words</span>
                        </div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={16}
                          className="w-full rounded-xl border bg-background p-4 text-sm font-mono leading-relaxed outline-none focus:border-ring resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingChapter(null)}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.number)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Save className="h-4 w-4" />
                            Save Chapter
                          </button>
                        </div>
                      </div>
                    ) : hasContent ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-base font-semibold mt-4 mb-2">{children}</h4>,
                            p: ({ children }) => <p className="mb-4 text-foreground/90 leading-relaxed text-justify">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/40 pl-4 italic my-4 text-muted-foreground bg-muted/20 py-2 rounded-r-lg">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-6 rounded-lg border shadow-xs">
                                <table className="w-full text-sm font-sans">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
                            th: ({ children }) => <th className="px-4 py-2.5 text-left font-semibold border-b text-foreground">{children}</th>,
                            td: ({ children }) => <td className="px-4 py-2 border-b text-foreground/90">{children}</td>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            hr: () => <hr className="my-6 border-border" />,
                          }}
                        >
                          {item.chapter!.content}
                        </Markdown>
                      </div>
                    ) : (
                      /* Empty / Draft Chapter Placeholder */
                      <div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/10 font-sans space-y-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
                        <div>
                          <h4 className="font-semibold text-base">
                            Chapter {item.number} has not been compiled yet
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                            {item.number === 4
                              ? "Run statistical tests in the Data Analysis workspace to generate tables and APA findings, or click generate."
                              : "Generate this chapter using the academic research agents or edit it directly."}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button
                            onClick={() => handleGenerateChapter(item.number)}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Generating Chapter {item.number}...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                Generate Chapter {item.number}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleStartEdit(item.number, `# Chapter ${item.number}: ${item.title}\n\n## ${item.number}.1 Overview\nWrite chapter content here...`)}
                            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Draft Manually
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
