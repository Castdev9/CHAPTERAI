import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chapters = await prisma.chapter.findMany({
      where: { projectId: id },
      orderBy: { chapterNumber: "asc" },
    })
    return NextResponse.json(chapters)
  } catch (error) {
    console.error("Failed to fetch chapters:", error)
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 })
  }
}
