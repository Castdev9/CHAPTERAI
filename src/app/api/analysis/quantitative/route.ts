import { NextResponse } from "next/server"
import {
  calcDescriptiveStats,
  calcFrequencyTable,
  calcPearsonCorrelation,
  calcSpearmanCorrelation,
  calcLinearRegression,
  calcIndependentTTest,
  calcOneWayANOVA,
  calcChiSquare,
  calcCorrelationMatrix,
  generateAcademicChapter4Section,
  parseNumericData,
  parseGroupedData,
  parseContingencyTable,
} from "@/lib/statistics"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data, columns = {} } = body as {
      type: string
      data: Record<string, string>[]
      columns?: {
        value?: string
        group?: string
        x?: string
        y?: string
        row?: string
        col?: string
        groups?: string[]
      }
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case "descriptive": {
        if (!columns.value) {
          return NextResponse.json({ error: "Value column required" }, { status: 400 })
        }
        const values = parseNumericData(data, columns.value)
        result = {
          type: "descriptive",
          column: columns.value,
          stats: calcDescriptiveStats(values),
          n: values.length,
        }
        break
      }

      case "frequency": {
        if (!columns.value) {
          return NextResponse.json({ error: "Value column required" }, { status: 400 })
        }
        const rawValues = data.map((row) => row[columns.value!]).filter(Boolean)
        result = {
          type: "frequency",
          column: columns.value,
          table: calcFrequencyTable(rawValues),
          n: rawValues.length,
        }
        break
      }

      case "correlation": {
        if (!columns.x || !columns.y) {
          return NextResponse.json({ error: "X and Y columns required" }, { status: 400 })
        }
        const x = parseNumericData(data, columns.x)
        const y = parseNumericData(data, columns.y)
        const pearson = calcPearsonCorrelation(x, y)
        const spearman = calcSpearmanCorrelation(x, y)
        result = {
          type: "correlation",
          variables: { x: columns.x, y: columns.y },
          pearson,
          spearman,
          n: Math.min(x.length, y.length),
        }
        break
      }

      case "regression": {
        if (!columns.x || !columns.y) {
          return NextResponse.json({ error: "X and Y columns required" }, { status: 400 })
        }
        const x = parseNumericData(data, columns.x)
        const y = parseNumericData(data, columns.y)
        result = {
          type: "regression",
          dependent: columns.y,
          independent: columns.x,
          ...calcLinearRegression(x, y),
          n: Math.min(x.length, y.length),
        }
        break
      }

      case "ttest": {
        if (!columns.value || !columns.group) {
          return NextResponse.json({ error: "Value and group columns required" }, { status: 400 })
        }
        const { groups, groupLabels } = parseGroupedData(data, columns.value, columns.group)
        if (groupLabels.length !== 2) {
          return NextResponse.json({ error: "t-Test requires exactly 2 groups" }, { status: 400 })
        }
        const group1 = groups[groupLabels[0]]
        const group2 = groups[groupLabels[1]]
        result = {
          groups: [groupLabels[0], groupLabels[1]],
          ...calcIndependentTTest(group1, group2),
          type: "ttest",
        }
        break
      }

      case "anova": {
        if (!columns.value || !columns.group) {
          return NextResponse.json({ error: "Value and group columns required" }, { status: 400 })
        }
        const { groups, groupLabels } = parseGroupedData(data, columns.value, columns.group)
        const groupArrays = groupLabels.map((l) => groups[l])
        result = {
          type: "anova",
          groups: groupLabels,
          ...calcOneWayANOVA(groupArrays),
        }
        break
      }

      case "chisquare": {
        if (!columns.row || !columns.col) {
          return NextResponse.json({ error: "Row and column columns required" }, { status: 400 })
        }
        const contingency = parseContingencyTable(data, columns.row, columns.col)
        result = {
          type: "chisquare",
          rowLabels: contingency.rowLabels,
          colLabels: contingency.colLabels,
          ...calcChiSquare(contingency.observed),
        }
        break
      }

      case "matrix": {
        const matrixCols = columns.groups || (columns.x && columns.y ? [columns.x, columns.y] : [])
        if (matrixCols.length < 2) {
          return NextResponse.json({ error: "At least two columns required for correlation matrix" }, { status: 400 })
        }
        const matrixResult = calcCorrelationMatrix(data, matrixCols)
        result = {
          type: "matrix",
          ...matrixResult,
          n: data.length,
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unknown analysis type: ${type}` }, { status: 400 })
    }

    const academicSection = generateAcademicChapter4Section(result)
    return NextResponse.json({ ...result, academicSection })
  } catch (error) {
    console.error("Quantitative analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    )
  }
}
