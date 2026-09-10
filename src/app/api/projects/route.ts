import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json(projects)
  } catch (err) {
    console.error("GET /api/projects error:", err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const project = await prisma.project.create({
      data: {
        topic: body.topic,
        title: body.topic,
        academicLevel: body.academicLevel,
        department: body.department,
        institution: body.institution,
        country: body.country,
        methodology: body.methodology,
        citationStyle: body.citationStyle,
      },
    })

    await prisma.chapter.createMany({
      data: [
        { projectId: project.id, chapterNumber: 1, title: "Introduction" },
        { projectId: project.id, chapterNumber: 2, title: "Literature Review" },
        { projectId: project.id, chapterNumber: 3, title: "Methodology" },
        { projectId: project.id, chapterNumber: 4, title: "Data Analysis" },
        { projectId: project.id, chapterNumber: 5, title: "Summary, Conclusion, and Recommendations" },
        { projectId: project.id, chapterNumber: 6, title: "References" },
        { projectId: project.id, chapterNumber: 7, title: "Appendices" },
      ],
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
