"use client"

import { CheckCircle2, Circle, Loader2, BookOpen, Layers, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChapterStatus } from "@/types"

interface ChapterNavItem {
  number: number
  title: string
  icon: LucideIcon
}

interface ChapterNavigationProps {
  chapters: ChapterNavItem[]
  activeChapter: number
  onSelect: (number: number) => void
  chapterStatuses?: Record<number, ChapterStatus>
  isManuscriptView?: boolean
  onSelectManuscript?: () => void
}

const statusConfig: Record<ChapterStatus, { icon: typeof CheckCircle2; className: string }> = {
  COMPLETE: { icon: CheckCircle2, className: "text-green-500" },
  GENERATING: { icon: Loader2, className: "text-yellow-500 animate-spin" },
  DRAFT: { icon: Circle, className: "text-muted-foreground/40" },
}

export function ChapterNavigation({
  chapters,
  activeChapter,
  onSelect,
  chapterStatuses = {},
  isManuscriptView = false,
  onSelectManuscript,
}: ChapterNavigationProps) {
  // Count how many of chapters 1-5 are completed
  const completedCount = [1, 2, 3, 4, 5].filter(
    (n) => chapterStatuses[n] === "COMPLETE"
  ).length

  return (
    <nav className="w-56 border-r bg-muted/30 p-3 overflow-y-auto shrink-0 flex flex-col justify-between">
      <div>
        {/* Full Manuscript (Chapters 1 to 5) Nav Item */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Overview
          </p>
          <button
            type="button"
            onClick={() => onSelectManuscript?.()}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all group border",
              isManuscriptView
                ? "bg-primary text-primary-foreground font-semibold shadow-xs border-primary"
                : "border-border/60 bg-card hover:bg-muted text-foreground hover:border-primary/50"
            )}
          >
            <BookOpen className="h-4 w-4 shrink-0 text-primary group-hover:scale-105 transition-transform" />
            <div className="flex-1 min-w-0">
              <span className="truncate block font-medium leading-tight">
                Full Manuscript
              </span>
              <span className={cn(
                "text-[10px] block font-mono mt-0.5",
                isManuscriptView ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                Ch 1 - 5 ({completedCount}/5 ready)
              </span>
            </div>
          </button>
        </div>

        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Chapters
        </p>
        <div className="space-y-1">
          {chapters.map((chapter) => {
            const Icon = chapter.icon
            const status = chapterStatuses[chapter.number] || "DRAFT"
            const StatusIcon = statusConfig[status].icon
            const isActive = !isManuscriptView && activeChapter === chapter.number

            return (
              <button
                key={chapter.number}
                data-chapter={chapter.number}
                onClick={() => onSelect(chapter.number)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-xs">{chapter.title}</span>
                <StatusIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive
                      ? "text-primary-foreground/70"
                      : statusConfig[status].className
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
