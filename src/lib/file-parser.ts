import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import mammoth from "mammoth"

const MAX_CHARS_PER_FILE = 15000

export interface ParsedUpload {
  filename: string
  fileType: string
  content: string
}

function extractStoragePath(fileUrl: string): string | null {
  const match = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

async function downloadFileFromStorage(fileUrl: string): Promise<Buffer | null> {
  const storagePath = extractStoragePath(fileUrl)
  if (!storagePath) return null

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from("uploads")
    .download(storagePath)

  if (error || !data) {
    console.error("[FileParser] Download error:", error?.message)
    return null
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function parseCSV(buffer: Buffer): string {
  const text = buffer.toString("utf-8")
  const lines = text.split("\n").filter((l) => l.trim())
  if (lines.length === 0) return ""

  const header = lines[0]
  const rows = lines.slice(1, 101)

  let result = `CSV Data (${lines.length - 1} total rows, showing first ${rows.length}):\n\n`
  result += `Headers: ${header}\n\n`

  for (const row of rows) {
    result += `${row}\n`
  }

  return result
}

function parseExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  let result = ""

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

    if (data.length === 0) continue

    result += `Sheet: "${sheetName}" (${data.length} rows)\n`
    const headers = Object.keys(data[0])
    result += `Columns: ${headers.join(", ")}\n\n`

    const rows = data.slice(0, 100)
    for (const row of rows) {
      const values = headers.map((h) => String(row[h] ?? ""))
      result += values.join(" | ") + "\n"
    }

    if (data.length > 100) {
      result += `\n... (${data.length - 100} more rows)\n`
    }
    result += "\n"
  }

  return result
}

function parseText(buffer: Buffer): string {
  return buffer.toString("utf-8")
}

async function parsePDF(buffer: Buffer): Promise<string> {
  if (typeof globalThis.DOMMatrix === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).DOMMatrix = class DOMMatrix {
      constructor() {}
      multiply() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      toString() { return "" }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof globalThis.ImageData === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).ImageData = class ImageData {
      constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
    }
  }

  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result.text ?? ""
  } finally {
    await parser.destroy()
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

function truncateToMax(text: string): string {
  if (text.length <= MAX_CHARS_PER_FILE) return text
  return text.slice(0, MAX_CHARS_PER_FILE) + "\n\n[... content truncated ...]"
}

export async function parseUploadedFile(
  filename: string,
  fileType: string,
  fileUrl: string
): Promise<string> {
  try {
    const buffer = await downloadFileFromStorage(fileUrl)
    if (!buffer) return `[Could not download: ${filename}]`

    const ext = filename.split(".").pop()?.toLowerCase() ?? ""
    const mime = fileType.toLowerCase()

    let text: string

    if (mime === "text/plain" || ext === "txt") {
      text = parseText(buffer)
    } else if (mime === "text/csv" || ext === "csv") {
      text = parseCSV(buffer)
    } else if (
      mime.includes("spreadsheet") ||
      mime.includes("excel") ||
      ext === "xlsx" ||
      ext === "xls"
    ) {
      text = parseExcel(buffer)
    } else if (mime === "application/pdf" || ext === "pdf") {
      text = await parsePDF(buffer)
    } else if (
      mime.includes("wordprocessingml") ||
      mime.includes("msword") ||
      ext === "docx" ||
      ext === "doc"
    ) {
      text = await parseDOCX(buffer)
    } else {
      text = parseText(buffer)
    }

    return truncateToMax(text)
  } catch (error) {
    console.error(`[FileParser] Error parsing ${filename}:`, error)
    return `[Error parsing file: ${filename}]`
  }
}

export async function fetchAndParseProjectUploads(
  projectId: string
): Promise<ParsedUpload[]> {
  const uploads = await prisma.upload.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  })

  if (uploads.length === 0) return []

  const results: ParsedUpload[] = []

  for (const upload of uploads) {
    const content = await parseUploadedFile(
      upload.filename,
      upload.fileType,
      upload.fileUrl
    )
    results.push({
      filename: upload.filename,
      fileType: upload.fileType,
      content,
    })
  }

  return results
}

export function formatUploadsForPrompt(uploads: ParsedUpload[]): string {
  if (uploads.length === 0) return ""

  let prompt = "\n\n=== UPLOADED RESEARCH DATA ===\n"
  prompt += "The user has uploaded the following files for analysis:\n\n"

  for (const upload of uploads) {
    prompt += `--- File: ${upload.filename} (${upload.fileType}) ---\n`
    prompt += upload.content + "\n\n"
  }

  prompt += "=== END OF UPLOADED DATA ===\n"
  prompt += "Use the above data in your analysis. Reference specific findings, statistics, and patterns from this data.\n"

  return prompt
}
