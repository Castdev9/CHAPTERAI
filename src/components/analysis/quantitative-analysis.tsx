"use client"

import { useState, useCallback, useMemo } from "react"
import {
  ArrowLeft,
  Upload,
  Table,
  Sigma,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  Search,
  Sparkles,
  Grid3X3,
  BarChart3,
  ArrowUpDown,
  TrendingUp,
  TestTube,
} from "lucide-react"
import * as XLSX from "xlsx"
import { useMutation } from "@tanstack/react-query"
import { ResultsTable } from "./results-table"
import { cn } from "@/lib/utils"
import { SAMPLE_DATASETS } from "@/lib/sample-datasets"
import { toast } from "sonner"

interface QuantitativeAnalysisProps {
  projectId: string
  onBack: () => void
}

type AnalysisType =
  | "descriptive"
  | "frequency"
  | "correlation"
  | "matrix"
  | "regression"
  | "ttest"
  | "anova"
  | "chisquare"

const ANALYSIS_TYPES: {
  value: AnalysisType
  label: string
  icon: typeof Sigma
  desc: string
  requires: string[]
}[] = [
  {
    value: "descriptive",
    label: "Descriptive Statistics",
    icon: Sigma,
    desc: "Mean, median, SD, variance, skewness, kurtosis, IQR",
    requires: ["value"],
  },
  {
    value: "frequency",
    label: "Frequency Distribution",
    icon: Table,
    desc: "Counts, percentages, cumulative frequencies with chart",
    requires: ["value"],
  },
  {
    value: "correlation",
    label: "Bivariate Correlation",
    icon: ArrowUpDown,
    desc: "Pearson r and Spearman rank coefficients with significance",
    requires: ["x", "y"],
  },
  {
    value: "matrix",
    label: "Correlation Matrix",
    icon: Grid3X3,
    desc: "Multi-variable correlation matrix with APA significance stars",
    requires: ["x", "y"],
  },
  {
    value: "regression",
    label: "Linear Regression",
    icon: TrendingUp,
    desc: "Model fit (R²), ANOVA F-test, and regression equation",
    requires: ["x", "y"],
  },
  {
    value: "ttest",
    label: "Independent Samples t-Test",
    icon: TestTube,
    desc: "Compare means between 2 groups with Cohen's d effect size",
    requires: ["value", "group"],
  },
  {
    value: "anova",
    label: "One-Way ANOVA",
    icon: BarChart3,
    desc: "Compare means across 3+ groups with Eta² effect size",
    requires: ["value", "group"],
  },
  {
    value: "chisquare",
    label: "Chi-Square Test",
    icon: Grid3X3,
    desc: "Contingency table & association with Cramér's V",
    requires: ["row", "col"],
  },
]

export function QuantitativeAnalysis({ projectId, onBack }: QuantitativeAnalysisProps) {
  const [dataTab, setDataTab] = useState<"upload" | "paste" | "sample">("upload")
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [previewLimit, setPreviewLimit] = useState(10)

  // Diagnostics and Health Check
  const diagnostics = useMemo(() => {
    if (!rawData || rawData.length === 0 || columns.length === 0) return null

    let totalCells = rawData.length * columns.length
    let missingCells = 0

    // Analyze column types
    const columnTypes: Record<string, "numeric" | "categorical"> = {}
    let numericColsCount = 0
    let categoricalColsCount = 0

    columns.forEach((col) => {
      let isNum = true
      let filled = 0

      for (const row of rawData.slice(0, 50)) {
        const val = row[col]?.trim()
        if (val === undefined || val === null || val === "") {
          missingCells++
        } else {
          filled++
          if (isNaN(Number(val))) {
            isNum = false
          }
        }
      }

      if (isNum && filled > 0) {
        columnTypes[col] = "numeric"
        numericColsCount++
      } else {
        columnTypes[col] = "categorical"
        categoricalColsCount++
      }
    })

    const completeness = Math.max(0, Math.round(((totalCells - missingCells) / totalCells) * 100))

    return {
      rowCount: rawData.length,
      colCount: columns.length,
      missingCells,
      completeness,
      numericColsCount,
      categoricalColsCount,
      columnTypes,
    }
  }, [rawData, columns])

  const filteredPreviewData = useMemo(() => {
    if (!rawData) return []
    if (!searchQuery.trim()) return rawData.slice(0, previewLimit)

    const q = searchQuery.toLowerCase()
    return rawData
      .filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      )
      .slice(0, previewLimit)
  }, [rawData, searchQuery, previewLimit])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setFileName(file.name)
    setResult(null)
    setAnalysisType(null)

    const isJson = file.name.endsWith(".json")

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        if (isJson) {
          const jsonText = evt.target?.result as string
          const parsed = JSON.parse(jsonText)
          const arrayData = Array.isArray(parsed) ? parsed : [parsed]
          if (arrayData.length === 0) {
            setError("JSON file is empty.")
            return
          }
          setRawData(arrayData)
          setColumns(Object.keys(arrayData[0]))
          toast.success(`Loaded JSON with ${arrayData.length} records`)
          return
        }

        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)

        if (jsonData.length === 0) {
          setError("The file appears to be empty.")
          return
        }

        setRawData(jsonData)
        setColumns(Object.keys(jsonData[0]))
        toast.success(`Loaded ${jsonData.length} rows and ${Object.keys(jsonData[0]).length} columns`)
      } catch {
        setError("Failed to parse file. Please ensure it is a valid CSV, Excel, or JSON file.")
      }
    }

    if (isJson) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleParsePastedData = useCallback(() => {
    setError("")
    if (!pasteText.trim()) {
      setError("Please paste some CSV, TSV, or tab-delimited data first.")
      return
    }

    try {
      const workbook = XLSX.read(pasteText, { type: "string" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)

      if (jsonData.length === 0) {
        setError("Could not parse table rows from pasted text.")
        return
      }

      setRawData(jsonData)
      setColumns(Object.keys(jsonData[0]))
      setFileName("Pasted Data Input")
      setResult(null)
      toast.success(`Successfully parsed ${jsonData.length} rows!`)
    } catch {
      setError("Failed to parse tabular text. Ensure headers exist in the first line.")
    }
  }, [pasteText])

  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId)
    if (!found) return

    setError("")
    setFileName(found.name)
    setRawData(found.data)
    setColumns(found.columns)
    setResult(null)
    setAnalysisType(null)
    toast.success(`Loaded "${found.name}"`)
  }

  const runAnalysis = useMutation({
    mutationFn: async () => {
      if (!rawData || !analysisType) return null

      const res = await fetch("/api/analysis/quantitative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: analysisType,
          data: rawData,
          columns: selectedColumns,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Analysis failed")
      }

      return res.json()
    },
    onSuccess: (data) => {
      if (data) setResult(data)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Analysis failed")
    },
  })

  const handleColumnSelect = (key: string, value: string) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: value }))
  }

  const renderColumnSelector = () => {
    if (!analysisType) return null

    const config = ANALYSIS_TYPES.find((a) => a.value === analysisType)
    if (!config) return null

    const columnLabels: Record<string, string> = {
      value: "Target Variable (numeric)",
      x: "Independent Variable (X)",
      y: "Dependent Variable (Y)",
      group: "Grouping Factor (categorical)",
      row: "Row Variable (categorical)",
      col: "Column Variable (categorical)",
    }

    return (
      <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-2">
          <config.icon className="h-4 w-4 text-primary" />
          <p className="font-semibold text-sm">Select Variables for {config.label}</p>
        </div>

        {config.requires.map((req) => (
          <div key={req}>
            <label className="text-xs font-medium text-muted-foreground">
              {columnLabels[req] || req}
            </label>
            <select
              value={selectedColumns[req] || ""}
              onChange={(e) => handleColumnSelect(req, e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              <option value="">Select variable...</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col} {diagnostics?.columnTypes[col] ? `(${diagnostics.columnTypes[col]})` : ""}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={() => runAnalysis.mutate()}
          disabled={runAnalysis.isPending || config.requires.some((r) => !selectedColumns[r])}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {runAnalysis.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Computing Statistical Models...
            </span>
          ) : (
            `Run ${config.label}`
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b px-6 py-3 flex items-center justify-between shrink-0 bg-muted/20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analysis Mode Selector
        </button>
        {rawData && (
          <span className="text-xs text-muted-foreground font-mono">
            {rawData.length} rows • {columns.length} columns loaded
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Chapter 4: Quantitative Data Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your dataset, perform automated statistical computations, generate APA 7th edition interpretations, and save findings directly to Chapter 4.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Data Input Selection Tabs */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3 mb-5">
              <button
                type="button"
                onClick={() => setDataTab("upload")}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dataTab === "upload"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload File (CSV, Excel, JSON)
              </button>
              <button
                type="button"
                onClick={() => setDataTab("paste")}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dataTab === "paste"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <FileText className="h-4 w-4" />
                Paste Raw Data
              </button>
              <button
                type="button"
                onClick={() => setDataTab("sample")}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dataTab === "sample"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Database className="h-4 w-4" />
                Load Sample Datasets
              </button>
            </div>

            {dataTab === "upload" && (
              <div className="rounded-lg border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors bg-muted/10">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-base mb-1">
                  {fileName ? `Loaded: ${fileName}` : "Upload your empirical research data"}
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                  Supports CSV, Excel (.xlsx, .xls), and JSON with column headers in the first row.
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="block w-full max-w-md mx-auto text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
            )}

            {dataTab === "paste" && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Paste comma-separated (CSV) or tab-delimited (TSV) values with headers:
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Participant_ID,Score_Pre,Score_Post,Group
P001,65,85,Experimental
P002,70,88,Experimental
P003,58,62,Control
P004,62,64,Control`}
                  rows={5}
                  className="w-full rounded-lg border bg-background p-3 font-mono text-xs outline-none focus:border-ring resize-y"
                />
                <button
                  type="button"
                  onClick={handleParsePastedData}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Table className="h-4 w-4" />
                  Parse Tabular Data
                </button>
              </div>
            )}

            {dataTab === "sample" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample.id)}
                    className="flex flex-col text-left p-4 rounded-lg border hover:border-primary/60 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {sample.name}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                        {sample.rowCount} records
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sample.description}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {sample.columns.slice(0, 4).map((c) => (
                        <span key={c} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                          {c}
                        </span>
                      ))}
                      {sample.columns.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{sample.columns.length - 4} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data Diagnostics & Health Check */}
          {diagnostics && (
            <div className="rounded-xl border bg-muted/15 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-sm">Data Diagnostic & Validation Health</h3>
                </div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-2.5 py-0.5 rounded-full">
                  {diagnostics.completeness}% Completeness
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg border bg-background p-3">
                  <span className="text-muted-foreground">Total Rows (N)</span>
                  <p className="text-base font-semibold mt-0.5 font-mono">{diagnostics.rowCount}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <span className="text-muted-foreground">Total Columns</span>
                  <p className="text-base font-semibold mt-0.5 font-mono">{diagnostics.colCount}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <span className="text-muted-foreground">Numeric Variables</span>
                  <p className="text-base font-semibold mt-0.5 font-mono">{diagnostics.numericColsCount}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <span className="text-muted-foreground">Categorical Variables</span>
                  <p className="text-base font-semibold mt-0.5 font-mono">{diagnostics.categoricalColsCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Type Chooser & Run */}
          {rawData && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">Select Statistical Test</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a statistical procedure to execute on your loaded dataset
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ANALYSIS_TYPES.map((at) => {
                  const Icon = at.icon
                  const isSelected = analysisType === at.value
                  return (
                    <button
                      key={at.value}
                      onClick={() => {
                        setAnalysisType(at.value)
                        setResult(null)
                        setSelectedColumns({})
                      }}
                      className={cn(
                        "flex flex-col text-left p-3.5 rounded-xl border transition-all hover:border-primary/60",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "bg-card"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-xs truncate">{at.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {at.desc}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-6 lg:grid-cols-3 pt-2">
                <div className="lg:col-span-1">
                  {renderColumnSelector()}
                </div>
                <div className="lg:col-span-2">
                  {result && (
                    <ResultsTable
                      result={result}
                      onBack={() => setResult(null)}
                      projectId={projectId}
                    />
                  )}
                </div>
              </div>

              {/* Data Preview Table */}
              {columns.length > 0 && (
                <div className="rounded-xl border overflow-hidden bg-card mt-6">
                  <div className="border-b bg-muted/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Data Preview ({rawData.length} rows total)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search data..."
                          className="h-8 pl-8 pr-2.5 text-xs rounded-md border bg-background outline-none focus:border-ring w-40"
                        />
                      </div>
                      <select
                        value={previewLimit}
                        onChange={(e) => setPreviewLimit(Number(e.target.value))}
                        className="h-8 px-2 text-xs rounded-md border bg-background outline-none"
                      >
                        <option value={10}>Show 10</option>
                        <option value={25}>Show 25</option>
                        <option value={50}>Show 50</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          {columns.slice(0, 10).map((col) => (
                            <th key={col} className="px-3.5 py-2 text-left font-medium whitespace-nowrap text-muted-foreground">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPreviewData.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-muted/15 transition-colors">
                            {columns.slice(0, 10).map((col) => (
                              <td key={col} className="px-3.5 py-2 whitespace-nowrap max-w-[180px] truncate font-mono text-[11px]">
                                {row[col] ?? "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
