import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getChatModel, getChapterModel, createStreamResponse, isAIConfigured, getAIErrorMessage } from "@/lib/ai"
import { processUserPrompt, getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"
import { fetchAndParseProjectUploads, formatUploadsForPrompt } from "@/lib/file-parser"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, chapterNumber, content } = body as {
      projectId: string
      chapterNumber: number
      content: string
    }

    if (!projectId || !chapterNumber || !content) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, chapterNumber, content" },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.message.create({
      data: { projectId, chapterNumber, role: "user", content },
    })

    const previousMessages = await prisma.message.findMany({
      where: { projectId, chapterNumber },
      orderBy: { createdAt: "asc" },
      take: 20,
    })

    const completedChapters = await prisma.chapter.findMany({
      where: { projectId, status: "COMPLETE" },
      orderBy: { chapterNumber: "asc" },
    })

    const generatedChapters: Record<number, string> = {}
    for (const ch of completedChapters) {
      if (ch.chapterNumber !== chapterNumber && ch.content) {
        generatedChapters[ch.chapterNumber] = ch.content.slice(0, 3000)
      }
    }

    const agentContext: AgentContext = {
      projectId,
      topic: project.topic,
      academicLevel: project.academicLevel,
      methodology: project.methodology,
      citationStyle: project.citationStyle,
      department: project.department,
      institution: project.institution,
      country: project.country,
      chapterNumber,
      previousMessages: previousMessages.map((m) => ({ role: m.role, content: m.content })),
      generatedChapters,
    }

    const isFullChapterRequest =
      content.toLowerCase().includes("generate complete") ||
      content.toLowerCase().includes("write chapter") ||
      content.toLowerCase().includes("generate full chapter")

    const agent = getAgentForChapter(chapterNumber)
    const system = agent.systemPrompt(agentContext)

    let prompt = content

    let uploadDataText = ""
    if (chapterNumber === 4) {
      const uploads = await fetchAndParseProjectUploads(projectId)
      uploadDataText = formatUploadsForPrompt(uploads)
    }

    if (isFullChapterRequest) {
      prompt = `Generate the complete content for Chapter ${chapterNumber} of my research on "${project.topic}".
Use ${project.citationStyle} citation style throughout.
I am a ${project.academicLevel.toLowerCase()} student in ${project.department} at ${project.institution}.
My research uses ${project.methodology.replace(/_/g, " ")} methodology.
Please generate comprehensive, well-structured academic content with all required sections properly formatted.
${uploadDataText}

CRITICAL CITATION REQUIREMENTS:
- Every factual claim, theory, statistic, method, and finding MUST have an in-text citation (${project.citationStyle} format).
- Every paragraph must contain 2-4 in-text citations. Never write a paragraph without citations.
- Never write "Research shows..." without citing WHO showed it. Always: "According to Smith (2023)..." or "(Smith, 2023)".
- End the chapter with a complete References section containing 20-30 entries.
- Every in-text citation MUST have a matching Reference entry, and every Reference MUST be cited in-text.
- Use realistic author names, journal names, years, DOIs, and page numbers.

IMPORTANT: Use the uploaded research data above to analyze, interpret, and discuss real findings. Reference specific data points, statistics, and patterns from the uploaded files.`
    } else if (chapterNumber === 4 && uploadDataText) {
      prompt = `${content}${uploadDataText}

Analyze, interpret, and discuss the above uploaded data in your response. Reference specific findings from the data.`
    }

    const model = isFullChapterRequest ? getChapterModel() : getChatModel()

    if (model) {
      const stream = createStreamResponse({
        model,
        system,
        prompt,
        temperature: 0.7,
        maxTokens: isFullChapterRequest ? 8192 : 2048,
      })

      if (stream) {
        const encoder = new TextEncoder()
        let fullResponse = ""

        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()

        ;(async () => {
          try {
            for await (const chunk of stream.fullStream) {
              if (chunk.type === "text-delta" && chunk.textDelta) {
                fullResponse += chunk.textDelta
                await writer.write(
                  encoder.encode(JSON.stringify({ type: "text", content: chunk.textDelta }) + "\n")
                )
              } else if (chunk.type === "error") {
                console.error("[Chat API] Stream error chunk:", JSON.stringify(chunk))
              }
            }

            if (isFullChapterRequest && fullResponse) {
              await prisma.chapter.updateMany({
                where: { projectId, chapterNumber },
                data: { content: fullResponse, status: "COMPLETE" },
              })
            }

            if (fullResponse) {
              await prisma.message.create({
                data: { projectId, chapterNumber, role: "assistant", content: fullResponse },
              })
            }

            await writer.write(
              encoder.encode(JSON.stringify({ type: "done", messageId: "stream-complete" }) + "\n")
            )
          } catch (error) {
            console.error("[Chat API] Stream processing error:", error)
            const errorMessage =
              error instanceof Error ? error.message : "Failed to generate response"
            try {
              await writer.write(
                encoder.encode(
                  JSON.stringify({ type: "error", content: errorMessage }) + "\n"
                )
              )
            } catch {
              // Writer may already be closed
            }
          } finally {
            try {
              await writer.close()
            } catch {
              // Already closed
            }
          }
        })()

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
          },
        })
      }
    }

    if (!isAIConfigured()) {
      const errorMsg = getAIErrorMessage()
      return NextResponse.json(
        { error: errorMsg || "AI is not configured. Please add OPENROUTER_API_KEY in your Vercel project settings." },
        { status: 503 }
      )
    }

    const fallbackPrompt = chapterNumber === 4 && uploadDataText
      ? `${prompt}${uploadDataText}`
      : prompt
    const { content: agentResponse } = await processUserPrompt(agentContext, fallbackPrompt)

    if (isFullChapterRequest) {
      await prisma.chapter.updateMany({
        where: { projectId, chapterNumber },
        data: { content: agentResponse, status: "COMPLETE" },
      })
    }

    await prisma.message.create({
      data: { projectId, chapterNumber, role: "assistant", content: agentResponse },
    })

    return NextResponse.json({ success: true, content: agentResponse })
  } catch (error) {
    console.error("[Chat API] Fatal error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to process message"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
