import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx"
import { jsPDF } from "jspdf"

type ProjectData = {
  topic: string
  academicLevel: string
  department: string
  institution: string
  country: string
  methodology: string
  citationStyle: string
  chapters: { chapterNumber: number; title: string; content: string }[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const format = searchParams.get("format") || "docx"

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          where: { status: "COMPLETE" },
          orderBy: { chapterNumber: "asc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.chapters.length === 0) {
      return NextResponse.json({ error: "No completed chapters to export" }, { status: 400 })
    }

    if (format === "docx") {
      return await exportDocx(project)
    }

    if (format === "pdf") {
      return await exportPdf(project)
    }

    return await exportHtml(project)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

async function exportDocx(project: ProjectData) {
  const children: Paragraph[] = []

  // Title page
  children.push(
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: project.topic, bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({ text: `Academic Level: ${project.academicLevel}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Department: ${project.department}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${project.institution}, ${project.country}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: `Citation Style: ${project.citationStyle}`, size: 24 })],
    })
  )

  // Chapters
  for (const chapter of project.chapters) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 400 },
        children: [
          new TextRun({
            text: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
            bold: true,
            size: 28,
          }),
        ],
      })
    )

    const paragraphs = chapter.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    for (const para of paragraphs) {
      if (para.startsWith("# ")) {
        children.push(
          new Paragraph({
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: para.replace(/^# /, ""),
                bold: true,
                size: 26,
              }),
            ],
          })
        )
      } else if (para.startsWith("## ")) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: para.replace(/^## /, ""),
                bold: true,
                size: 24,
              }),
            ],
          })
        )
      } else if (para.startsWith("- ") || para.startsWith("* ")) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: 720 },
            children: [new TextRun({ text: para.substring(2), size: 22 })],
          })
        )
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [new TextRun({ text: para, size: 22 })],
          })
        )
      }
    }
  }

  const doc = new Document({
    title: project.topic,
    description: `Research project - ${project.academicLevel}`,
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 22 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{ children }],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${sanitize(project.topic)}.docx"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

async function exportPdf(project: ProjectData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25
  const contentWidth = pageWidth - margin * 2
  const lineHeight = 6

  let y = 0

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  function addPageNumber() {
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFont("times", "normal")
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(String(i), pageWidth / 2, pageHeight - 10, { align: "center" })
    }
  }

  // Title page
  doc.setFont("times", "bold")
  doc.setFontSize(22)
  doc.setTextColor(0)
  y = pageHeight / 3
  const titleLines = doc.splitTextToSize(project.topic, contentWidth)
  doc.text(titleLines, pageWidth / 2, y, { align: "center" })
  y += titleLines.length * 10 + 15

  doc.setFont("times", "normal")
  doc.setFontSize(12)
  doc.setTextColor(60)
  doc.text(`Academic Level: ${project.academicLevel}`, pageWidth / 2, y, { align: "center" })
  y += 8
  doc.text(`Department: ${project.department}`, pageWidth / 2, y, { align: "center" })
  y += 8
  doc.text(`${project.institution}, ${project.country}`, pageWidth / 2, y, { align: "center" })
  y += 8
  doc.text(`Citation Style: ${project.citationStyle}`, pageWidth / 2, y, { align: "center" })

  // Table of Contents page
  doc.addPage()
  y = margin
  doc.setFont("times", "bold")
  doc.setFontSize(18)
  doc.setTextColor(0)
  doc.text("Table of Contents", pageWidth / 2, y, { align: "center" })
  y += 15

  doc.setFont("times", "normal")
  doc.setFontSize(12)
  for (const chapter of project.chapters) {
    checkPageBreak(10)
    const label = `Chapter ${chapter.chapterNumber}: ${chapter.title}`
    doc.text(label, margin, y)
    y += 8
  }

  // Chapters
  for (const chapter of project.chapters) {
    doc.addPage()
    y = margin

    // Chapter title
    doc.setFont("times", "bold")
    doc.setFontSize(18)
    doc.setTextColor(0)
    const chapterTitle = `Chapter ${chapter.chapterNumber}: ${chapter.title}`
    doc.text(chapterTitle, pageWidth / 2, y, { align: "center" })
    y += 15

    const paragraphs = chapter.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    for (const para of paragraphs) {
      if (para.startsWith("# ")) {
        checkPageBreak(15)
        y += 5
        doc.setFont("times", "bold")
        doc.setFontSize(15)
        doc.setTextColor(0)
        const text = para.replace(/^# /, "")
        const lines = doc.splitTextToSize(text, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 7 + 5
      } else if (para.startsWith("## ")) {
        checkPageBreak(12)
        y += 3
        doc.setFont("times", "bold")
        doc.setFontSize(13)
        doc.setTextColor(30)
        const text = para.replace(/^## /, "")
        const lines = doc.splitTextToSize(text, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 6.5 + 4
      } else if (para.startsWith("### ")) {
        checkPageBreak(10)
        y += 2
        doc.setFont("times", "bold")
        doc.setFontSize(12)
        doc.setTextColor(50)
        const text = para.replace(/^### /, "")
        const lines = doc.splitTextToSize(text, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 6 + 3
      } else if (para.startsWith("- ") || para.startsWith("* ")) {
        const text = para.replace(/^[-*] /, "")
        const lines = doc.splitTextToSize(text, contentWidth - 8)
        checkPageBreak(lines.length * lineHeight + 2)
        doc.setFont("times", "normal")
        doc.setFontSize(11)
        doc.setTextColor(0)
        doc.text("\u2022", margin + 2, y)
        doc.text(lines, margin + 8, y)
        y += lines.length * lineHeight + 2
      } else {
        const lines = doc.splitTextToSize(para, contentWidth)
        checkPageBreak(lines.length * lineHeight + 4)
        doc.setFont("times", "normal")
        doc.setFontSize(11)
        doc.setTextColor(0)
        doc.text(lines, margin, y)
        y += lines.length * lineHeight + 4
      }
    }
  }

  addPageNumber()

  const buffer = Buffer.from(doc.output("arraybuffer"))

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitize(project.topic)}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

async function exportHtml(project: ProjectData) {
  const chaptersHtml = project.chapters
    .map(
      (ch) => `
    <div class="chapter">
      <h2>Chapter ${ch.chapterNumber}: ${ch.title}</h2>
      ${ch.content
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("")}
    </div>
  `
    )
    .join('<div class="page-break"></div>')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.topic}</title>
  <style>
    @page { margin: 2.54cm; }
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 2; color: #000; max-width: 21cm; margin: 0 auto; padding: 2.54cm; }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 0.5cm; }
    h2 { font-size: 14pt; margin-top: 1cm; margin-bottom: 0.5cm; }
    p { text-align: justify; margin-bottom: 0.5cm; }
    .page-break { page-break-after: always; }
    .title-page { text-align: center; padding-top: 5cm; }
    .title-page h1 { font-size: 18pt; margin-bottom: 1cm; }
    .title-page p { text-align: center; font-size: 12pt; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${project.topic}</h1>
    <p>Academic Level: ${project.academicLevel}</p>
    <p>Department: ${project.department}</p>
    <p>${project.institution}, ${project.country}</p>
    <p>Citation Style: ${project.citationStyle}</p>
  </div>
  <div class="page-break"></div>
  ${chaptersHtml}
</body>
</html>`

  const buffer = Buffer.from(html, "utf-8")

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sanitize(project.topic)}.html"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").substring(0, 100)
}
