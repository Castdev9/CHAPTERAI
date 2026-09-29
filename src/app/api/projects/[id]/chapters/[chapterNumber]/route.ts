import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; chapterNumber: string }> }
) {
  try {
    const { id, chapterNumber: chNumStr } = await params
    const chapterNumber = parseInt(chNumStr, 10)

    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 })
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId: id,
          chapterNumber,
        },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Failed to fetch chapter:", error)
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; chapterNumber: string }> }
) {
  try {
    const { id, chapterNumber: chNumStr } = await params
    const chapterNumber = parseInt(chNumStr, 10)

    if (isNaN(chapterNumber)) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 })
    }

    const body = await request.json()
    const { content, status, title } = body

    const dataToUpdate: any = {}
    if (typeof content === "string") dataToUpdate.content = content
    if (typeof status === "string") dataToUpdate.status = status
    if (typeof title === "string") dataToUpdate.title = title

    // Update using updateMany which works on both real prisma and the in-memory store
    const result = await prisma.chapter.updateMany({
      where: {
        projectId: id,
        chapterNumber,
      },
      data: dataToUpdate,
    })

    // If no existing record was found, create one
    if (result.count === 0) {
      const titles: Record<number, string> = {
        1: "Introduction",
        2: "Literature Review",
        3: "Methodology",
        4: "Data Analysis",
        5: "Summary & Conclusion",
        6: "References",
        7: "Appendices",
      }
      await prisma.chapter.createMany({
        data: [
          {
            projectId: id,
            chapterNumber,
            title: title || titles[chapterNumber] || `Chapter ${chapterNumber}`,
            content: content || "",
            status: status || "COMPLETE",
          },
        ],
      })
    }

    const updated = await prisma.chapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId: id,
          chapterNumber,
        },
      },
    })

    return NextResponse.json(updated || { success: true })
  } catch (error) {
    console.error("Failed to update chapter:", error)
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 })
  }
}
