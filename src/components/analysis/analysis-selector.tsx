"use client"

import { useState } from "react"
import { BarChart3, MessageCircle, Layers, Bot, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisType } from "@/types"
import { QuantitativeAnalysis } from "./quantitative-analysis"
import { QualitativeAnalysis } from "./qualitative-analysis"
import { MixedAnalysis } from "./mixed-analysis"
import { ChatArea } from "@/components/chat/chat-area"

interface AnalysisSelectorProps {
  projectId: string
}

export function AnalysisSelector({ projectId }: AnalysisSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType | "CHAT" | null>("QUANTITATIVE")

  if (selectedType === "QUANTITATIVE") {
    return <QuantitativeAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "QUALITATIVE") {
    return <QualitativeAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "MIXED") {
    return <MixedAnalysis projectId={projectId} onBack={() => setSelectedType(null)} />
  }

  if (selectedType === "CHAT") {
    return (
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <div className="border-b px-6 py-2.5 flex items-center justify-between bg-muted/20 shrink-0">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-primary" />
            Chapter 4 AI Assistant Chat
          </span>
          <button
            onClick={() => setSelectedType(null)}
            className="text-xs text-primary hover:underline font-medium"
          >
            ← Switch to Data Analysis Tools
          </button>
        </div>
        <ChatArea projectId={projectId} chapterNumber={4} />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Chapter 4: Data Analysis Workspace</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Upload and analyze your empirical dataset, perform statistical tests, or chat with the Analysis Agent.
          </p>
        </div>

        <div className="grid gap-3.5">
          <button
            onClick={() => setSelectedType("QUANTITATIVE")}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Quantitative Analysis & Statistics
                </h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload CSV/Excel, run descriptive statistics, frequency tables, t-tests, ANOVA, correlations, and regressions with APA 7th ed. writeups.
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedType("QUALITATIVE")}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Qualitative & Thematic Analysis
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Paste transcripts, voice dictate field notes, code excerpts, and extract major themes with supporting evidence.
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedType("MIXED")}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Mixed Methods & Triangulation
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Synthesize quantitative statistical metrics with qualitative interview quotes to establish comprehensive empirical triangulation.
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedType("CHAT")}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md group border-dashed"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Chapter 4 AI Assistant Chat
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ask questions about your data analysis, discuss interpretation strategies, or prompt the Analysis Agent with voice recognition.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
