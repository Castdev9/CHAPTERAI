export interface DescriptiveStats {
  n: number
  mean: number
  median: number
  mode: number[]
  stdDev: number
  variance: number
  standardError?: number
  skewness?: number
  kurtosis?: number
  q1?: number
  q3?: number
  iqr?: number
  min: number
  max: number
  range: number
  sum: number
}

export interface FrequencyTable {
  value: string | number
  frequency: number
  percentage: number
  cumulativeFrequency: number
  cumulativePercentage: number
}

export interface CorrelationResult {
  type: "pearson" | "spearman"
  coefficient: number
  pValue: number
  interpretation: string
}

export interface RegressionResult {
  rSquared: number
  adjustedRSquared: number
  coefficients: { variable: string; coefficient: number; stdError: number; tStat: number; pValue: number }[]
  anova: { ss: number; df: number; ms: number; fStat: number; pValue: number; significance: string }
  equation: string
}

export interface TTestResult {
  type: "independent" | "paired" | "oneSample"
  tStatistic: number
  df: number
  pValue: number
  meanDiff: number
  ci95: [number, number]
  cohensD?: number
  interpretation: string
}

export interface ANOVAResult {
  source: "between" | "within" | "total"
  ss: number
  df: number
  ms: number
  fStat: number
  pValue: number
  etaSquared?: number
  interpretation: string
}

export interface ChiSquareResult {
  chiSquare: number
  df: number
  pValue: number
  cramersV?: number
  expectedFrequencies: number[][]
  interpretation: string
}

export function calcDescriptiveStats(data: number[]): DescriptiveStats {
  const sorted = [...data].sort((a, b) => a - b)
  const n = data.length
  if (n === 0) {
    return { n: 0, mean: 0, median: 0, mode: [], stdDev: 0, variance: 0, standardError: 0, skewness: 0, kurtosis: 0, q1: 0, q3: 0, iqr: 0, min: 0, max: 0, range: 0, sum: 0 }
  }
  const sum = data.reduce((a, b) => a + b, 0)
  const mean = sum / n

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]

  const freqMap = new Map<number, number>()
  data.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1))
  const maxFreq = Math.max(...freqMap.values())
  const mode = [...freqMap.entries()]
    .filter(([, f]) => f === maxFreq)
    .map(([v]) => v)

  const variance = n > 1 ? data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1) : 0
  const stdDev = Math.sqrt(variance)
  const standardError = n > 0 ? stdDev / Math.sqrt(n) : 0
  const min = sorted[0]
  const max = sorted[n - 1]
  const range = max - min

  const q1 = sorted[Math.floor(n * 0.25)] ?? min
  const q3 = sorted[Math.floor(n * 0.75)] ?? max
  const iqr = q3 - q1

  let skewness = 0
  let kurtosis = 0
  if (n > 2 && stdDev > 0) {
    const m3 = data.reduce((acc, v) => acc + (v - mean) ** 3, 0) / n
    const m4 = data.reduce((acc, v) => acc + (v - mean) ** 4, 0) / n
    const m2 = (variance * (n - 1)) / n
    if (m2 > 0) {
      skewness = (m3 / Math.pow(m2, 1.5)) * (Math.sqrt(n * (n - 1)) / (n - 2))
      kurtosis = m4 / Math.pow(m2, 2) - 3
    }
  }

  return { n, mean, median, mode, stdDev, variance, standardError, skewness, kurtosis, q1, q3, iqr, min, max, range, sum }
}

export function calcFrequencyTable(
  data: (string | number)[],
  bins?: number
): FrequencyTable[] {
  const freqMap = new Map<string | number, number>()
  data.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1))

  const entries = [...freqMap.entries()].sort((a, b) => {
    if (typeof a[0] === "number" && typeof b[0] === "number") return a[0] - b[0]
    return String(a[0]).localeCompare(String(b[0]))
  })

  const total = data.length
  let cumFreq = 0

  return entries.map(([value, frequency]) => {
    cumFreq += frequency
    return {
      value,
      frequency,
      percentage: (frequency / total) * 100,
      cumulativeFrequency: cumFreq,
      cumulativePercentage: (cumFreq / total) * 100,
    }
  })
}

export function calcPearsonCorrelation(x: number[], y: number[]): CorrelationResult {
  const n = Math.min(x.length, y.length)
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let denX = 0
  let denY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const r = num / Math.sqrt(denX * denY)
  const tStat = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r)
  const pValue = tDistribution(tStat, n - 2)

  return {
    type: "pearson",
    coefficient: r,
    pValue,
    interpretation: interpretCorrelation(r, pValue),
  }
}

export function calcSpearmanCorrelation(x: number[], y: number[]): CorrelationResult {
  const rankX = rankify(x)
  const rankY = rankify(y)
  return calcPearsonCorrelation(rankX, rankY)
}

function rankify(data: number[]): number[] {
  const sorted = [...data].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const ranks = new Array(data.length)

  sorted.forEach((item, idx) => {
    ranks[item.i] = idx + 1
  })

  return ranks
}

function interpretCorrelation(r: number, pValue: number): string {
  const strength = Math.abs(r)
  let desc = ""
  if (strength < 0.1) desc = "negligible"
  else if (strength < 0.3) desc = "weak"
  else if (strength < 0.5) desc = "moderate"
  else if (strength < 0.7) desc = "strong"
  else desc = "very strong"

  const direction = r >= 0 ? "positive" : "negative"
  const sig = pValue <= 0.05 ? "statistically significant" : "not statistically significant"

  return `There is a ${desc} ${direction} correlation (r = ${r.toFixed(3)}, p = ${pValue.toFixed(4)}). The correlation is ${sig}.`
}

export function calcLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  const n = Math.min(x.length, y.length)
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    num += dx * (y[i] - meanY)
    den += dx * dx
  }

  const slope = num / den
  const intercept = meanY - slope * meanX

  const yPred = x.map((xi) => intercept + slope * xi)
  const residuals = y.map((yi, i) => yi - yPred[i])

  const ssRes = residuals.reduce((a, b) => a + b * b, 0)
  const ssTot = y.reduce((a, b) => a + (b - meanY) ** 2, 0)
  const ssReg = ssTot - ssRes
  const rSquared = ssReg / ssTot

  const seSlope = Math.sqrt(ssRes / (n - 2)) / Math.sqrt(den)
  const seIntercept = seSlope * Math.sqrt(1 / n + (meanX * meanX) / den)

  const tSlope = slope / seSlope
  const pSlope = tDistribution(tSlope, n - 2)

  const fStat = ssReg / (ssRes / (n - 2))
  const pF = fDistribution(fStat, 1, n - 2)

  return {
    rSquared,
    adjustedRSquared: 1 - (1 - rSquared) * ((n - 1) / (n - 2)),
    coefficients: [
      {
        variable: "Intercept",
        coefficient: intercept,
        stdError: seIntercept,
        tStat: intercept / seIntercept,
        pValue: tDistribution(intercept / seIntercept, n - 2),
      },
      {
        variable: "X",
        coefficient: slope,
        stdError: seSlope,
        tStat: tSlope,
        pValue: pSlope,
      },
    ],
    anova: {
      ss: ssReg,
      df: 1,
      ms: ssReg,
      fStat,
      pValue: pF,
      significance: pF <= 0.05 ? "significant" : "not significant",
    },
    equation: `Y = ${intercept.toFixed(3)} + ${slope.toFixed(3)}X`,
  }
}

export function calcIndependentTTest(
  group1: number[],
  group2: number[]
): TTestResult {
  const n1 = group1.length
  const n2 = group2.length
  const mean1 = group1.reduce((a, b) => a + b, 0) / n1
  const mean2 = group2.reduce((a, b) => a + b, 0) / n2

  const var1 = group1.reduce((a, v) => a + (v - mean1) ** 2, 0) / (n1 - 1)
  const var2 = group2.reduce((a, v) => a + (v - mean2) ** 2, 0) / (n2 - 1)

  const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
  const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2))
  const tStat = (mean1 - mean2) / se
  const df = n1 + n2 - 2
  const pValue = tDistribution(tStat, df)

  const pooledStd = Math.sqrt(pooledVar)
  const cohensD = pooledStd > 0 ? Math.abs((mean1 - mean2) / pooledStd) : 0
  const ci95: [number, number] = [
    (mean1 - mean2) - 1.96 * pooledStd * Math.sqrt(1 / n1 + 1 / n2),
    (mean1 - mean2) + 1.96 * pooledStd * Math.sqrt(1 / n1 + 1 / n2),
  ]

  const effectSizeLabel = cohensD < 0.2 ? "negligible" : cohensD < 0.5 ? "small" : cohensD < 0.8 ? "medium" : "large"

  return {
    type: "independent",
    tStatistic: tStat,
    df,
    pValue,
    meanDiff: mean1 - mean2,
    ci95,
    cohensD,
    interpretation: `An independent samples t-test was conducted. The analysis revealed ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} difference between the two groups, t(${df}) = ${tStat.toFixed(3)}, p = ${pValue.toFixed(4)}, with a ${effectSizeLabel} effect size (Cohen's d = ${cohensD.toFixed(3)}). The 95% confidence interval of the mean difference [${(mean1 - mean2).toFixed(3)}] ranged from ${ci95[0].toFixed(3)} to ${ci95[1].toFixed(3)}.`,
  }
}

export function calcOneWayANOVA(
  groups: number[][]
): ANOVAResult & { groupStats: { label: string; n: number; mean: number; stdDev: number }[]; ssTotal: number } {
  const k = groups.length
  const allData = groups.flat()
  const n = allData.length
  const grandMean = allData.reduce((a, b) => a + b, 0) / n

  let ssBetween = 0
  let ssWithin = 0

  const groupStats = groups.map((group, i) => {
    const gn = group.length
    const gMean = group.reduce((a, b) => a + b, 0) / gn
    const gVar = group.reduce((a, v) => a + (v - gMean) ** 2, 0)
    ssBetween += gn * (gMean - grandMean) ** 2
    ssWithin += gVar
    return {
      label: `Group ${i + 1}`,
      n: gn,
      mean: gMean,
      stdDev: Math.sqrt(gVar / (gn - 1)),
    }
  })

  const dfBetween = k - 1
  const dfWithin = n - k
  const msBetween = ssBetween / dfBetween
  const msWithin = ssWithin / dfWithin
  const fStat = msBetween / msWithin
  const pValue = fDistribution(fStat, dfBetween, dfWithin)
  const ssTotal = ssBetween + ssWithin
  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0
  const etaLabel = etaSquared < 0.01 ? "negligible" : etaSquared < 0.06 ? "small" : etaSquared < 0.14 ? "medium" : "large"

  return {
    source: "between",
    ss: ssBetween,
    df: dfBetween,
    ms: msBetween,
    fStat,
    pValue,
    etaSquared,
    ssTotal,
    interpretation: `A one-way between-subjects analysis of variance (ANOVA) was conducted. Results revealed ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} effect across the comparison groups, F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(3)}, p = ${pValue.toFixed(4)}, η² = ${etaSquared.toFixed(3)} (${etaLabel} effect size).`,
    groupStats,
  }
}

export function calcChiSquare(
  observed: number[][]
): ChiSquareResult {
  const rows = observed.length
  const cols = observed[0].length

  const rowTotals = observed.map((r) => r.reduce((a, b) => a + b, 0))
  const colTotals = observed[0].map((_, j) => observed.reduce((a, r) => a + r[j], 0))
  const total = rowTotals.reduce((a, b) => a + b, 0)

  const expected = observed.map((r, i) =>
    r.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
  )

  let chiSquare = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] > 0) {
        chiSquare += (observed[i][j] - expected[i][j]) ** 2 / expected[i][j]
      }
    }
  }

  const df = (rows - 1) * (cols - 1)
  const pValue = chiSquareDistribution(chiSquare, df)
  const minDim = Math.min(rows, cols)
  const cramersV = total > 0 && minDim > 1 ? Math.sqrt(chiSquare / (total * (minDim - 1))) : 0

  return {
    chiSquare,
    df,
    pValue,
    cramersV,
    expectedFrequencies: expected,
    interpretation: `A Pearson Chi-Square test of independence was performed. There was ${pValue <= 0.05 ? "a statistically significant" : "no statistically significant"} association between the examined categorical variables, χ²(${df}, N = ${total}) = ${chiSquare.toFixed(3)}, p = ${pValue.toFixed(4)}, Cramér's V = ${cramersV.toFixed(3)}.`,
  }
}

function tDistribution(t: number, df: number): number {
  const x = (df + t * t) / (df + t * t)
  const a = df / 2
  const b = 0.5
  return 2 * (1 - regularizedIncompleteBeta(x, a, b) / beta(a, b))
}

function fDistribution(f: number, df1: number, df2: number): number {
  const x = (df1 * f) / (df1 * f + df2)
  return 1 - regularizedIncompleteBeta(x, df1 / 2, df2 / 2)
}

function chiSquareDistribution(x: number, df: number): number {
  const p = gamma(df / 2)
  const result = 1 - regularizedIncompleteBeta(x / (x + df), df / 2, 0.5) / p
  return Math.abs(result)
}

function gamma(n: number): number {
  if (n === 1) return 1
  if (n === 0.5) return Math.sqrt(Math.PI)
  return (n - 1) * gamma(n - 1)
}

function regularizedIncompleteBeta(x: number, a: number, b: number, iterations = 100): number {
  if (x < 0 || x > 1) return 0
  if (x === 0 || x === 1) return x

  const lb = logBeta(a, b)
  let sum = 0

  for (let i = 0; i < iterations; i++) {
    const term = (
      Math.exp(
        logGamma(a + b) - logGamma(a + i + 1) - logGamma(b - i) +
        (a + i) * Math.log(x) + (b - i - 1) * Math.log(1 - x) + Math.log(a + i)
      )
    )
    sum += term
    if (Math.abs(term) < 1e-10) break
  }

  return sum * x
}

function logGamma(n: number): number {
  if (n <= 0) return Infinity
  if (n < 0.5) return logGamma(n + 1) - Math.log(n)

  const g = 7
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]

  let x = n - 1
  let tmp = x + g + 0.5
  tmp = (x + 0.5) * Math.log(tmp) - tmp
  let ser = c[0]

  for (let i = 1; i < c.length; i++) {
    x += 1
    ser += c[i] / x
  }

  return tmp + Math.log(2.5066282746310002 * ser)
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

function beta(a: number, b: number): number {
  return Math.exp(logBeta(a, b))
}

export function parseNumericData(raw: Record<string, string>[], column: string): number[] {
  return raw
    .map((row) => parseFloat(row[column]))
    .filter((v) => !isNaN(v))
}

export function parseGroupedData(
  raw: Record<string, string>[],
  valueColumn: string,
  groupColumn: string
): { groups: Record<string, number[]>; groupLabels: string[] } {
  const groups: Record<string, number[]> = {}

  raw.forEach((row) => {
    const group = row[groupColumn] || "Unknown"
    const value = parseFloat(row[valueColumn])
    if (!isNaN(value)) {
      if (!groups[group]) groups[group] = []
      groups[group].push(value)
    }
  })

  return {
    groups,
    groupLabels: Object.keys(groups),
  }
}

export function parseContingencyTable(
  raw: Record<string, string>[],
  rowColumn: string,
  colColumn: string
): { observed: number[][]; rowLabels: string[]; colLabels: string[] } {
  const rows = new Set<string>()
  const cols = new Set<string>()

  raw.forEach((row) => {
    rows.add(row[rowColumn] || "Unknown")
    cols.add(row[colColumn] || "Unknown")
  })

  const rowLabels = [...rows]
  const colLabels = [...cols]
  const matrix: Record<string, Record<string, number>> = {}

  rowLabels.forEach((r) => {
    matrix[r] = {}
    colLabels.forEach((c) => {
      matrix[r][c] = 0
    })
  })

  raw.forEach((row) => {
    const r = row[rowColumn] || "Unknown"
    const c = row[colColumn] || "Unknown"
    if (matrix[r] && matrix[r][c] !== undefined) {
      matrix[r][c]++
    }
  })

  const observed = rowLabels.map((r) => colLabels.map((c) => matrix[r][c]))

  return { observed, rowLabels, colLabels }
}

export interface CorrelationMatrixCell {
  r: number
  pValue: number
  sigStars: string
}

export function calcCorrelationMatrix(
  data: Record<string, string>[],
  columns: string[]
): { columns: string[]; matrix: CorrelationMatrixCell[][] } {
  const parsedData = columns.map((col) => parseNumericData(data, col))
  const nCols = columns.length
  const matrix: CorrelationMatrixCell[][] = []

  for (let i = 0; i < nCols; i++) {
    const row: CorrelationMatrixCell[] = []
    for (let j = 0; j < nCols; j++) {
      if (i === j) {
        row.push({ r: 1.0, pValue: 0.0, sigStars: "" })
      } else {
        const corr = calcPearsonCorrelation(parsedData[i], parsedData[j])
        let sigStars = ""
        if (corr.pValue < 0.001) sigStars = "***"
        else if (corr.pValue < 0.01) sigStars = "**"
        else if (corr.pValue < 0.05) sigStars = "*"
        row.push({
          r: corr.coefficient,
          pValue: corr.pValue,
          sigStars,
        })
      }
    }
    matrix.push(row)
  }

  return { columns, matrix }
}

export function generateAcademicChapter4Section(result: Record<string, any>): string {
  const type = result.type as string

  switch (type) {
    case "descriptive": {
      const stats = result.stats as DescriptiveStats
      const col = result.column as string
      return `### 4.3 Descriptive Statistics for ${col}

Descriptive statistical analysis was conducted on **${col}** (N = ${stats.n}). The distribution yielded a mean of *M* = ${stats.mean.toFixed(2)} with a standard deviation of *SD* = ${stats.stdDev.toFixed(2)} (Standard Error = ${(stats.standardError || 0).toFixed(2)}). Scores ranged from a minimum of ${stats.min} to a maximum of ${stats.max} (Range = ${stats.range}). The median score was ${stats.median.toFixed(2)}, with an interquartile range (IQR) of ${(stats.iqr || 0).toFixed(2)}.

| Metric | Value |
|---|---|
| Sample Size (*N*) | ${stats.n} |
| Mean (*M*) | ${stats.mean.toFixed(2)} |
| Std. Error (*SE*) | ${(stats.standardError || 0).toFixed(2)} |
| Median (*Mdn*) | ${stats.median.toFixed(2)} |
| Std. Deviation (*SD*) | ${stats.stdDev.toFixed(2)} |
| Variance (*s²*) | ${stats.variance.toFixed(2)} |
| Skewness | ${(stats.skewness || 0).toFixed(3)} |
| Kurtosis | ${(stats.kurtosis || 0).toFixed(3)} |
| Minimum | ${stats.min} |
| Maximum | ${stats.max} |

*Interpretation:* The univariate skewness of ${(stats.skewness || 0).toFixed(3)} and kurtosis of ${(stats.kurtosis || 0).toFixed(3)} falls well within the conventional thresholds for univariate normality (-2.0 to +2.0), supporting the use of parametric inferential testing.`
    }

    case "frequency": {
      const col = result.column as string
      const table = (result.table || []) as FrequencyTable[]
      const tableRows = table
        .map(
          (t) =>
            `| ${t.value} | ${t.frequency} | ${t.percentage.toFixed(1)}% | ${t.cumulativePercentage.toFixed(1)}% |`
        )
        .join("\n")

      return `### 4.2 Frequency Distribution for ${col}

Table 4.1 outlines the frequency and percentage distribution of respondents according to **${col}** (Total *N* = ${result.n}).

| Category / Level | Frequency (*f*) | Percentage (%) | Cumulative (%) |
|---|---|---|---|
${tableRows}

*Interpretation:* The highest proportion of participants fell into the "${table[0]?.value || "primary"}" group (*n* = ${table[0]?.frequency || 0}, ${table[0]?.percentage.toFixed(1) || 0}%), representing the predominant demographic cluster in the sampled population.`
    }

    case "correlation": {
      const x = result.variables?.x
      const y = result.variables?.y
      const p = result.pearson as CorrelationResult
      const sig = p.pValue < 0.05 ? "statistically significant" : "not statistically significant"

      return `### 4.4 Bivariate Correlation Analysis: ${x} and ${y}

A Pearson product-moment correlation coefficient was computed to assess the relationship between **${x}** and **${y}** (*N* = ${result.n}).

| Variable Pair | Pearson *r* | *p*-value | Significance | Direction |
|---|---|---|---|---|
| ${x} × ${y} | ${p.coefficient.toFixed(3)} | ${p.pValue.toFixed(4)} | ${sig} | ${p.coefficient >= 0 ? "Positive" : "Negative"} |

*Statistical Statement:* ${p.interpretation}

*Hypothesis Evaluation:* At the α = .05 significance level, the null hypothesis ($H_0$) stating no association between ${x} and ${y} is ${p.pValue <= 0.05 ? "**rejected**" : "**retained**"}. The empirical data indicates that higher levels of ${x} are systematically associated with ${p.coefficient >= 0 ? "increased" : "decreased"} levels of ${y}.`
    }

    case "regression": {
      const dep = result.dependent
      const indep = result.independent
      const coefs = (result.coefficients || []) as any[]
      const anova = result.anova as any

      const coefRows = coefs
        .map(
          (c) =>
            `| ${c.variable} | ${Number(c.coefficient).toFixed(3)} | ${Number(c.stdError).toFixed(3)} | ${Number(c.tStat).toFixed(3)} | ${Number(c.pValue).toFixed(4)} |`
        )
        .join("\n")

      return `### 4.5 Linear Regression Analysis: Predicting ${dep}

A simple linear regression was calculated to predict **${dep}** based on **${indep}**. A significant regression equation was found:

$$${result.equation}$$

| Model Metric | Value |
|---|---|
| *R* | ${Math.sqrt(result.rSquared).toFixed(3)} |
| *R²* (Coefficient of Determination) | ${Number(result.rSquared).toFixed(3)} |
| Adjusted *R²* | ${Number(result.adjustedRSquared).toFixed(3)} |
| ANOVA *F*(1, ${result.n - 2}) | ${Number(anova.fStat).toFixed(3)} |
| Model *p*-value | ${Number(anova.pValue).toFixed(4)} |

#### Regression Coefficients
| Variable | Coefficient (*B*) | Std. Error | *t* | *p*-value |
|---|---|---|---|---|
${coefRows}

*Interpretation:* The predictor variable accounted for ${(Number(result.rSquared) * 100).toFixed(1)}% of the total variance in ${dep}, with an overall model fit of *F*(1, ${result.n - 2}) = ${Number(anova.fStat).toFixed(3)}, *p* = ${Number(anova.pValue).toFixed(4)}. For each unit increase in ${indep}, ${dep} changes by ${Number(coefs[1]?.coefficient || 0).toFixed(3)} units.`
    }

    case "ttest": {
      const g = result.groups || ["Group 1", "Group 2"]
      return `### 4.4 Hypothesis Testing: Independent Samples t-Test

An independent-samples t-test was conducted to compare scores on the target measure between **${g[0]}** and **${g[1]}**.

| Test Metric | Value |
|---|---|
| Group 1 vs Group 2 | ${g[0]} vs ${g[1]} |
| *t*-statistic | ${Number(result.tStatistic).toFixed(3)} |
| Degrees of Freedom (*df*) | ${result.df} |
| *p*-value | ${Number(result.pValue).toFixed(4)} |
| Mean Difference | ${Number(result.meanDiff).toFixed(3)} |
| 95% Confidence Interval | [${Number(result.ci95?.[0]).toFixed(3)}, ${Number(result.ci95?.[1]).toFixed(3)}] |
| Effect Size (Cohen's *d*) | ${Number(result.cohensD || 0).toFixed(3)} |

*Academic Finding:* ${result.interpretation}
The research hypothesis proposing a significant difference between ${g[0]} and ${g[1]} is ${result.pValue <= 0.05 ? "**supported**" : "**not supported**"} by the empirical evidence.`
    }

    case "anova": {
      const anova = result as any
      const gStats = (anova.groupStats || []) as any[]
      const gRows = gStats
        .map(
          (g) =>
            `| ${g.label} | ${g.n} | ${Number(g.mean).toFixed(2)} | ${Number(g.stdDev).toFixed(2)} |`
        )
        .join("\n")

      return `### 4.4 Hypothesis Testing: One-Way ANOVA

A one-way between-groups analysis of variance was conducted to explore the impact of group factor on the outcome variable.

#### Group Descriptives
| Group Factor | *N* | Mean (*M*) | Std. Deviation (*SD*) |
|---|---|---|---|
${gRows}

#### ANOVA Summary Table
| Source | SS | df | MS | *F* | *p*-value | Effect Size (η²) |
|---|---|---|---|---|---|---|
| Between Groups | ${Number(anova.ss).toFixed(2)} | ${anova.df} | ${Number(anova.ms).toFixed(2)} | ${Number(anova.fStat).toFixed(3)} | ${Number(anova.pValue).toFixed(4)} | ${Number(anova.etaSquared || 0).toFixed(3)} |

*Interpretation:* ${anova.interpretation}
Because *p* ${anova.pValue <= 0.05 ? "< .05" : "> .05"}, we ${anova.pValue <= 0.05 ? "reject" : "fail to reject"} the null hypothesis of equal population means across groups.`
    }

    case "chisquare": {
      const chi = result as any
      return `### 4.4 Chi-Square Test of Independence

A Pearson Chi-Square test of independence was performed to examine the relationship between the categorical variables.

| Metric | Value |
|---|---|
| Chi-Square (χ²) | ${Number(chi.chiSquare).toFixed(3)} |
| Degrees of Freedom (*df*) | ${chi.df} |
| Asymptotic Significance (*p*) | ${Number(chi.pValue).toFixed(4)} |
| Cramér's *V* | ${Number(chi.cramersV || 0).toFixed(3)} |

*Interpretation:* ${chi.interpretation}`
    }

    default:
      return `### Analysis Findings\n\n${JSON.stringify(result, null, 2)}`
  }
}

