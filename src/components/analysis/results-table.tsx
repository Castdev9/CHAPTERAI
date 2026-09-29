"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  BarChart3,
  Table2,
  Sigma,
  ArrowUpDown,
  TrendingUp,
  TestTube,
  Grid3X3,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface ResultDisplayProps {
  result: Record<string, unknown>
  onBack: () => void
  projectId?: string
  onSavedToChapter?: () => void
}

export function ResultsTable({ result, onBack, projectId, onSavedToChapter }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!result) return null

  const type = result.type as string
  const academicSection = (result.academicSection as string) || (result.interpretation as string) || ""

  const handleCopyAcademic = async () => {
    try {
      await navigator.clipboard.writeText(academicSection)
      setCopied(true)
      toast.success("APA academic writeup copied to clipboard")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleSaveToChapter4 = async () => {
    if (!projectId) {
      toast.error("Project ID missing")
      return
    }

    setSaving(true)
    try {
      // First get current Chapter 4 content
      const getRes = await fetch(`/api/projects/${projectId}/chapters/4`)
      let currentContent = ""
      if (getRes.ok) {
        const chData = await getRes.json()
        currentContent = chData?.content || ""
      }

      // If current content is empty or default, create a rich Chapter 4 header
      let newContent = ""
      if (!currentContent.trim() || currentContent.includes("DRAFT") || currentContent.length < 50) {
        newContent = `# Chapter 4: Data Analysis and Presentation of Results\n\n## 4.1 Overview\nThis chapter presents the empirical findings of the research study based on systematic quantitative analysis. In accordance with APA standards, descriptive distributions, normality metrics, and formal hypothesis tests are reported below.\n\n${academicSection}\n`
      } else {
        newContent = `${currentContent.trim()}\n\n---\n\n${academicSection}\n`
      }

      const res = await fetch(`/api/projects/${projectId}/chapters/4`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          status: "COMPLETE",
          title: "Data Analysis and Presentation of Results",
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save to Chapter 4")
      }

      setSaved(true)
      toast.success("Analysis and APA writeup saved to Chapter 4 Manuscript!", { duration: 3500 })
      onSavedToChapter?.()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      toast.error(err.message || "Failed to update Chapter 4")
    } finally {
      setSaving(false)
    }
  }

  const renderDescriptive = () => {
    const stats = result.stats as Record<string, any>
    return (
      <div className="space-y-6">
        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sigma className="h-4 w-4 text-primary" />
              Descriptive Statistics: {result.column as string}
            </span>
            <span className="text-xs text-muted-foreground font-normal">APA Table Format</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-muted">
            {[
              { label: "N (Sample)", value: stats.n },
              { label: "Mean (M)", value: stats.mean?.toFixed(2) },
              { label: "Std. Error (SE)", value: stats.standardError ? stats.standardError.toFixed(3) : "-" },
              { label: "Median (Mdn)", value: stats.median?.toFixed(2) },
              { label: "Mode", value: Array.isArray(stats.mode) ? stats.mode.join(", ") : stats.mode },
              { label: "Std. Deviation (SD)", value: stats.stdDev?.toFixed(2) },
              { label: "Variance (s²)", value: stats.variance?.toFixed(2) },
              { label: "Skewness", value: stats.skewness !== undefined ? stats.skewness.toFixed(3) : "-" },
              { label: "Kurtosis", value: stats.kurtosis !== undefined ? stats.kurtosis.toFixed(3) : "-" },
              { label: "Q1 (25th %)", value: stats.q1 !== undefined ? stats.q1 : "-" },
              { label: "Q3 (75th %)", value: stats.q3 !== undefined ? stats.q3 : "-" },
              { label: "IQR", value: stats.iqr !== undefined ? stats.iqr : "-" },
              { label: "Minimum", value: stats.min },
              { label: "Maximum", value: stats.max },
              { label: "Range", value: stats.range },
              { label: "Sum", value: stats.sum },
            ].map((item) => (
              <div key={item.label} className="bg-background p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold text-sm mt-0.5">{item.value ?? "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderFrequency = () => {
    const table = result.table as Record<string, unknown>[]
    return (
      <div className="space-y-6">
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm flex items-center gap-2">
            <Table2 className="h-4 w-4 text-primary" />
            Frequency Distribution: {result.column as string}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                  <th className="px-4 py-2 text-right font-medium">Frequency</th>
                  <th className="px-4 py-2 text-right font-medium">Percentage (%)</th>
                  <th className="px-4 py-2 text-right font-medium">Cumulative Freq.</th>
                  <th className="px-4 py-2 text-right font-medium">Cumulative %</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2">{String(row.value)}</td>
                    <td className="px-4 py-2 text-right">{row.frequency as number}</td>
                    <td className="px-4 py-2 text-right">{(row.percentage as number).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right">{row.cumulativeFrequency as number}</td>
                    <td className="px-4 py-2 text-right">{(row.cumulativePercentage as number).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Bar Chart
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={table as Record<string, unknown>[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequency" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const renderCorrelation = () => {
    const pearson = result.pearson as Record<string, unknown>
    const spearman = result.spearman as Record<string, unknown>
    const vars = result.variables as Record<string, string>

    const renderCorrTable = (corr: Record<string, unknown>, label: string) => (
      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">{label}</div>
        <div className="space-y-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Correlation Coefficient (r)</span>
            <span className="font-semibold">{(corr.coefficient as number).toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">p-value</span>
            <span className="font-semibold">{(corr.pValue as number).toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interpretation</span>
            <span className="font-medium text-right max-w-[60%]">
              {corr.interpretation as string}
            </span>
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-semibold mb-1">Variables</p>
          <p>X (Independent): {vars.x}</p>
          <p>Y (Dependent): {vars.y}</p>
          <p>N: {result.n as number}</p>
        </div>
        {renderCorrTable(pearson, "Pearson Correlation")}
        {renderCorrTable(spearman, "Spearman Rank Correlation")}
      </div>
    )
  }

  const renderRegression = () => {
    const coefs = result.coefficients as Record<string, unknown>[]
    const anova = result.anova as Record<string, unknown>

    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="font-semibold text-sm mb-1">Regression Equation</p>
          <p className="font-mono text-sm">{result.equation as string}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">R²</p>
            <p className="font-semibold text-lg">{(result.rSquared as number).toFixed(4)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Adjusted R²</p>
            <p className="font-semibold text-lg">{(result.adjustedRSquared as number).toFixed(4)}</p>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">
            Coefficients
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left">Variable</th>
                  <th className="px-3 py-2 text-right">Coefficient</th>
                  <th className="px-3 py-2 text-right">Std. Error</th>
                  <th className="px-3 py-2 text-right">t</th>
                  <th className="px-3 py-2 text-right">p-value</th>
                </tr>
              </thead>
              <tbody>
                {coefs.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2">{c.variable as string}</td>
                    <td className="px-3 py-2 text-right font-mono">{(c.coefficient as number).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(c.stdError as number).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(c.tStat as number).toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(c.pValue as number).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="font-semibold text-sm mb-2">ANOVA (F-Test)</p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">F-statistic</span>
              <span className="font-mono">{(anova.fStat as number).toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">p-value</span>
              <span className="font-mono">{(anova.pValue as number).toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Significance</span>
              <span className={anova.pValue as number <= 0.05 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                {anova.significance as string}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTTest = () => (
    <div className="space-y-4">
      {!!result.groups && Array.isArray(result.groups) && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-semibold mb-1">Groups Compared</p>
          <p>Group 1: {(result.groups as string[])[0]}</p>
          <p>Group 2: {(result.groups as string[])[1]}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">t-statistic</p>
          <p className="font-semibold text-lg font-mono">{(result.tStatistic as number).toFixed(3)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Degrees of Freedom (df)</p>
          <p className="font-semibold text-lg">{result.df as number}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">p-value (2-tailed)</p>
          <p className={Number(result.pValue) <= 0.05 ? "font-semibold text-lg text-green-600 font-mono" : "font-semibold text-lg text-amber-600 font-mono"}>
            {(result.pValue as number).toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Cohen&apos;s d (Effect Size)</p>
          <p className="font-semibold text-lg font-mono">
            {result.cohensD !== undefined ? (result.cohensD as number).toFixed(3) : "-"}
          </p>
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <p className="font-semibold text-sm mb-1">Mean Difference & 95% Confidence Interval</p>
        <p className="text-sm">
          Difference: <span className="font-mono font-medium">{(result.meanDiff as number).toFixed(3)}</span> | 95% CI: <span className="font-mono font-medium">[{(result.ci95 as [number, number])[0].toFixed(3)}, {(result.ci95 as [number, number])[1].toFixed(3)}]</span>
        </p>
      </div>
    </div>
  )

  const renderANOVA = () => {
    const groupStats = result.groupStats as Record<string, unknown>[]
    return (
      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">Group Statistics</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left">Group</th>
                  <th className="px-3 py-2 text-right">N</th>
                  <th className="px-3 py-2 text-right">Mean</th>
                  <th className="px-3 py-2 text-right">Std. Dev.</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.map((g, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2">{g.label as string}</td>
                    <td className="px-3 py-2 text-right">{g.n as number}</td>
                    <td className="px-3 py-2 text-right font-mono">{(g.mean as number).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(g.stdDev as number).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">ANOVA Table</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-right">SS</th>
                  <th className="px-3 py-2 text-right">df</th>
                  <th className="px-3 py-2 text-right">MS</th>
                  <th className="px-3 py-2 text-right">F</th>
                  <th className="px-3 py-2 text-right">p-value</th>
                  <th className="px-3 py-2 text-right">η² (Eta²)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/20">
                  <td className="px-3 py-2">Between Groups</td>
                  <td className="px-3 py-2 text-right font-mono">{(result.ss as number).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{result.df as number}</td>
                  <td className="px-3 py-2 text-right font-mono">{(result.ms as number).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{(result.fStat as number).toFixed(3)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{(result.pValue as number).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {result.etaSquared !== undefined ? (result.etaSquared as number).toFixed(3) : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderChiSquare = () => {
    const expected = result.expectedFrequencies as number[][]
    const rowLabels = result.rowLabels as string[]
    const colLabels = result.colLabels as string[]
    const observed = result.observed as number[][] | undefined

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Chi-Square (χ²)</p>
            <p className="font-semibold text-lg font-mono">{(result.chiSquare as number).toFixed(3)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Degrees of Freedom (df)</p>
            <p className="font-semibold text-lg">{result.df as number}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Cramér&apos;s V (Effect Size)</p>
            <p className="font-semibold text-lg font-mono">
              {result.cramersV !== undefined ? (result.cramersV as number).toFixed(3) : "-"}
            </p>
          </div>
        </div>

        {observed && (
          <div className="rounded-lg border overflow-hidden">
            <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">Contingency Table (Observed Frequencies)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left"></th>
                    {colLabels.map((c, i) => (
                      <th key={i} className="px-3 py-2 text-right">{c}</th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {observed.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{rowLabels[i]}</td>
                      {row.map((v, j) => (
                        <td key={j} className="px-3 py-2 text-right font-mono">{v}</td>
                      ))}
                      <td className="px-3 py-2 text-right font-mono font-semibold">{row.reduce((a, b) => a + b, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMatrix = () => {
    const cols = (result.columns as string[]) || []
    const matrix = (result.matrix as any[][]) || []

    return (
      <div className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold text-sm">
            Correlation Matrix (Pearson r)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left">Variable</th>
                  {cols.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 text-right font-mono">
                      ({idx + 1})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map((col, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">
                      ({i + 1}) {col}
                    </td>
                    {cols.map((_, j) => {
                      const cell = matrix[i]?.[j]
                      return (
                        <td key={j} className="px-3 py-2 text-right font-mono">
                          {i === j ? "1.00" : `${cell?.r?.toFixed(2)}${cell?.sigStars || ""}`}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-xs text-muted-foreground border-t bg-muted/20">
            *p &lt; .05, **p &lt; .01, ***p &lt; .001 (two-tailed)
          </div>
        </div>
      </div>
    )
  }

  const renderIcon = () => {
    switch (type) {
      case "descriptive": return <Sigma className="h-5 w-5" />
      case "frequency": return <Table2 className="h-5 w-5" />
      case "correlation": return <ArrowUpDown className="h-5 w-5" />
      case "matrix": return <Grid3X3 className="h-5 w-5" />
      case "regression": return <TrendingUp className="h-5 w-5" />
      case "ttest": return <TestTube className="h-5 w-5" />
      case "anova": return <BarChart3 className="h-5 w-5" />
      case "chisquare": return <Grid3X3 className="h-5 w-5" />
      default: return <BarChart3 className="h-5 w-5" />
    }
  }

  const typeLabels: Record<string, string> = {
    descriptive: "Descriptive Statistics",
    frequency: "Frequency Distribution",
    correlation: "Correlation Analysis",
    matrix: "Correlation Matrix",
    regression: "Regression Analysis",
    ttest: "Independent Samples t-Test",
    anova: "One-Way ANOVA",
    chisquare: "Chi-Square Test",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          {renderIcon()}
          {typeLabels[type] || "Analysis Results"}
        </div>
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Change Parameters
        </button>
      </div>

      {type === "descriptive" && renderDescriptive()}
      {type === "frequency" && renderFrequency()}
      {type === "correlation" && renderCorrelation()}
      {type === "matrix" && renderMatrix()}
      {type === "regression" && renderRegression()}
      {type === "ttest" && renderTTest()}
      {type === "anova" && renderANOVA()}
      {type === "chisquare" && renderChiSquare()}

      {/* Academic APA Interpretation & Chapter 4 Narrative Section */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-base text-foreground">
              Academic Interpretation & Findings (Chapter 4)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAcademic}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  Copy APA Writeup
                </>
              )}
            </button>
            {projectId && (
              <button
                onClick={handleSaveToChapter4}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving to Chapter 4...
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved to Chapter 4!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Save to Chapter 4 Manuscript
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans bg-background/80 p-4 rounded-lg border">
          {academicSection || (result.interpretation as string)}
        </div>
      </div>
    </div>
  )
}
