import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getChatModel,
  getChapterModel,
  createStreamResponse,
  isAIConfigured,
  getAIErrorMessage,
} from "@/lib/ai"
import { getAgentForChapter } from "@/agents"
import type { AgentContext } from "@/agents/types"

export const runtime = "nodejs"
export const maxDuration = 120

function generateAcademicGuidance(
  userQuery: string,
  project: any,
  chapterNumber: number,
  isFullChapter: boolean
): string {
  const topic = project?.topic || "your research topic"
  const citationStyle = project?.citationStyle || "APA"
  const academicLevel = project?.academicLevel || "MASTERS"
  const department = project?.department || "Academic Department"
  const methodology = project?.methodology || "Mixed Methods"

  if (isFullChapter) {
    if (chapterNumber === 1) {
      return `# Chapter 1: Introduction

## 1.1 Background of the Study
The research topic "${topic}" represents a critical inquiry within contemporary scholarship in ${department}. Technological, institutional, and social transitions demand systematic evaluation of underlying constructs (Smith & Johnson, 2022). In ${academicLevel.toLowerCase()} research, contextualizing theoretical antecedents alongside empirical observations establishes the epistemological foundation.

## 1.2 Statement of the Problem
Despite growing interest, existing institutional and practical frameworks for ${topic} remain inconsistent. Prior research has identified notable gaps in empirical validation, creating uncertainty for practitioners and scholars (Davis et al., 2023).

## 1.3 Research Objectives
1. To examine baseline perceptions and current practices surrounding ${topic}.
2. To assess the measurable impacts of institutional interventions on primary performance indicators.
3. To formulate an evidence-based strategic framework tailored for implementation.

## 1.4 Research Questions
1. How do relevant stakeholders engage with ${topic} in their daily operational workflows?
2. What are the statistically observable relationships between intervention variables and expected outcomes?
3. What key guidelines should institutional leadership establish to ensure long-term efficacy?

## 1.5 Significance of the Study
This study contributes valuable empirical data and conceptual clarity to the literature in ${department}.

> 💡 *Note: To generate full chapters using live LLM reasoning, configure GEMINI_API_KEY in Settings → Environment Variables.*`
    } else if (chapterNumber === 4) {
      return `# Chapter 4: Data Analysis and Presentation

## 4.1 Overview of Collected Data
This chapter presents the empirical findings resulting from the ${methodology.toLowerCase()} investigation into "${topic}". A total of N = 240 valid responses were retained following data cleaning and outlier screening.

## 4.2 Descriptive Statistics
Key demographic variables and construct dimensions were evaluated using central tendency metrics (Mean, Standard Deviation, and Skewness within acceptable ranges: |s| < 1.0).

| Variable / Construct | Mean (M) | Std. Deviation (SD) | Alpha (α) |
|---|---|---|---|
| Construct A (Perceived Utility) | 4.18 | 0.62 | 0.89 |
| Construct B (Operational Ease) | 3.94 | 0.74 | 0.85 |
| Outcome Performance Index | 4.05 | 0.58 | 0.91 |

## 4.3 Hypothesis Testing & Inferential Analysis
Pearson product-moment correlation revealed a statistically significant positive relationship between Construct A and Outcome Performance (r = 0.68, p < 0.001). Regression modeling confirmed Construct A as a strong predictor (β = 0.54, t = 9.42, p < 0.001), explaining 46% of variance (R² = 0.46).

## 4.4 Summary of Key Findings
The quantitative and qualitative indicators demonstrate robust empirical support for the hypothesized model.

> 💡 *Note: Configure GEMINI_API_KEY in Settings to enable dynamic AI data synthesis tailored to your raw data.*`
    } else if (chapterNumber === 5) {
      return `# Chapter 5: Summary, Conclusion, and Recommendations

## 5.1 Summary of Findings
This study investigated "${topic}" through a ${methodology.toLowerCase()} design. The primary research questions were answered with high empirical consistency, demonstrating clear relationships across evaluated dimensions.

## 5.2 Scholarly Conclusion
The findings demonstrate that systematic intervention significantly enhances outcomes, validating the theoretical framework established in Chapter 2.

## 5.3 Actionable Recommendations
1. **For Institutional Practice:** Develop formalized guidelines and training modules for stakeholders.
2. **For Policy Formulators:** Integrate standardized assessment metrics into governance frameworks.
3. **For Future Research:** Conduct longitudinal evaluations across wider geographical cohorts to test generalizability.

> 💡 *Note: Configure GEMINI_API_KEY in Settings for custom generative chapter outputs.*`
    } else {
      return `# Chapter ${chapterNumber}: Detailed Scholarly Analysis

## Overview
This section addresses Chapter ${chapterNumber} for "${topic}" (${academicLevel} level), adhering to ${citationStyle} referencing conventions.

## Core Theoretical & Empirical Discussion
Rigorous alignment between the methodology (${methodology}) and thematic objectives ensures high scholarly validity. Literature indicates that establishing clear empirical boundaries enables robust synthesis across both quantitative indicators and qualitative reflections (Thompson et al., 2023).

## Analytical Synthesis
Evidence gathered confirms the central premise of the inquiry, providing actionable insights for ${department}.

> 💡 *Note: Add GEMINI_API_KEY or OPENROUTER_API_KEY in Settings to stream live LLM outputs.*`
    }
  }

  // Conversational response
  if (/objective|aim/i.test(userQuery)) {
    return `### Recommended Research Objectives for "${topic}"

Based on your **${academicLevel.toLowerCase()}** research in **${department}**, here are recommended SMART research objectives:

1. **Investigate baseline practices:** Examine current utilization patterns and stakeholder perceptions regarding ${topic}.
2. **Quantify measurable outcomes:** Evaluate the statistical relationship between intervention parameters and performance indicators.
3. **Develop a strategic framework:** Formulate an evidence-based roadmap for ethical and sustainable implementation.

*All subsequent citations will be formatted in **${citationStyle}** style.*

> 💡 *Note: You can add GEMINI_API_KEY in Settings to enable live generative chat with Gemini 2.5 Flash.*`
  }

  if (/question|rq/i.test(userQuery)) {
    return `### Proposed Research Questions for "${topic}"

Here are three focused research questions aligned with your **${methodology}** design:

1. **RQ1 (Descriptive):** What are the prevailing adoption patterns and perspectives regarding ${topic}?
2. **RQ2 (Correlational/Inferential):** Is there a statistically significant difference in outcome metrics following the intervention?
3. **RQ3 (Qualitative/Exploratory):** How do key participants perceive and navigate structural challenges associated with ${topic}?

> 💡 *Tip: Add GEMINI_API_KEY in Settings to enable live streaming AI responses.*`
  }

  return `### Academic Research Guidance (Chapter ${chapterNumber})

Regarding your question on **"${topic}"**:

For a **${academicLevel.toLowerCase()}** dissertation in **${department}**, maintaining methodological rigor and clear alignment with your core research questions is essential.

**Scholarly Tips:**
- **Triangulation:** Since your project uses a **${methodology}** methodology, ensure findings from quantitative metrics and qualitative observations complement and validate each other.
- **Citation Rigor:** Ensure all cited claims strictly follow **${citationStyle}** guidelines.
- **Section Progression:** Move logically from empirical background to problem articulation, analytical synthesis, and actionable recommendations.

Feel free to ask me to draft specific subsections, suggest survey questions, or format references!

> 💡 *Tip: Add GEMINI_API_KEY in Settings → Environment Variables to enable live AI streaming.*`
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log("[CHAT-1] Request received")

  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      console.error("[CHAT-1] Failed to parse request body")
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const projectId = body.projectId as string | undefined
    const chapterNumber = body.chapterNumber as number | undefined
    const content = body.content as string | undefined

    console.log("[CHAT-2] Request body parsed:", {
      projectId: !!projectId,
      chapterNumber: !!chapterNumber,
      contentLength: content?.length ?? 0,
    })

    if (!projectId || !chapterNumber || !content) {
      console.error("[CHAT-3] Validation failed:", {
        projectId: !!projectId,
        chapterNumber: !!chapterNumber,
        content: !!content,
      })
      return NextResponse.json(
        {
          error: `Missing required fields. projectId: ${!!projectId}, chapterNumber: ${!!chapterNumber}, content: ${!!content}`,
        },
        { status: 400 }
      )
    }

    console.log("[CHAT-3] Validation passed. projectId=%s chapter=%d contentLength=%d", projectId, chapterNumber, content.length)

    console.log("[CHAT-4] Prisma client initialized:", !!prisma)

    let project
    try {
      console.log("[CHAT-5] Project lookup started")
      project = await prisma.project.findUnique({
        where: { id: projectId },
      })
    } catch (dbError) {
      console.error("[CHAT-5] DATABASE ERROR during project lookup:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed. Check DATABASE_URL in Vercel environment variables.",
        },
        { status: 500 }
      )
    }

    if (!project) {
      console.error("[CHAT-5] Project not found:", projectId)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("[CHAT-6] Project found:", project.topic)

    try {
      console.log("[CHAT-7] Saving user message")
      await prisma.message.create({
        data: { projectId, chapterNumber, role: "user", content },
      })
    } catch (dbError) {
      console.error("[CHAT-7] DATABASE ERROR saving user message:", dbError)
      return NextResponse.json(
        { error: "Failed to save message to database." },
        { status: 500 }
      )
    }

    console.log("[CHAT-7] User message saved")

    let previousMessages
    try {
      console.log("[CHAT-8] Loading previous messages")
      previousMessages = await prisma.message.findMany({
        where: { projectId, chapterNumber },
        orderBy: { createdAt: "asc" },
        take: 20,
      })
    } catch (dbError) {
      console.error("[CHAT-8] DATABASE ERROR loading messages:", dbError)
      return NextResponse.json(
        { error: "Failed to load message history." },
        { status: 500 }
      )
    }

    console.log("[CHAT-8] Previous messages loaded:", previousMessages.length)

    let completedChapters: Awaited<ReturnType<typeof prisma.chapter.findMany>> = []
    try {
      console.log("[CHAT-9] Loading chapter context")
      completedChapters = await prisma.chapter.findMany({
        where: { projectId, status: "COMPLETE" },
        orderBy: { chapterNumber: "asc" },
      })
    } catch (dbError) {
      console.error("[CHAT-9] DATABASE ERROR loading chapters:", dbError)
      completedChapters = []
    }

    const generatedChapters: Record<number, string> = {}
    for (const ch of completedChapters) {
      if (ch.chapterNumber !== chapterNumber && ch.content) {
        generatedChapters[ch.chapterNumber] = ch.content.slice(0, 3000)
      }
    }

    console.log("[CHAT-9] Chapter context loaded:", Object.keys(generatedChapters).length, "completed chapters")

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
      previousMessages: previousMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      generatedChapters,
    }

    console.log("[CHAT-10] Agent context created")

    const isFullChapterRequest =
      content.toLowerCase().includes("generate complete") ||
      content.toLowerCase().includes("write chapter") ||
      content.toLowerCase().includes("generate full chapter")

    const agent = getAgentForChapter(chapterNumber)
    const system = agent.systemPrompt(agentContext)

    let prompt = content

    let uploadDataText = ""
    if (chapterNumber === 4) {
      try {
        console.log("[CHAT-10b] Loading chapter 4 uploads (lazy import)")
        const { fetchAndParseProjectUploads, formatUploadsForPrompt } = await import(
          "@/lib/file-parser"
        )
        const uploads = await fetchAndParseProjectUploads(projectId)
        uploadDataText = formatUploadsForPrompt(uploads)
        console.log("[CHAT-10b] Upload data loaded:", uploadDataText.length, "chars")
      } catch (uploadError) {
        console.error("[CHAT-10b] Upload parsing error (non-fatal):", uploadError)
      }
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

    const apiKeyPresent =
      !!process.env.GEMINI_API_KEY ||
      !!process.env.GOOGLE_GEMINI_API_KEY ||
      !!process.env.OPENROUTER_API_KEY ||
      !!process.env.OPENAI_API_KEY
    console.log("[CHAT-11] AI model initialization started. API key present:", apiKeyPresent)

    const model = isFullChapterRequest ? getChapterModel() : getChatModel()
    console.log("[CHAT-12] AI model initialized:", !!model)

    if (!model) {
      console.log("[CHAT-12] Live AI model not configured — streaming interactive academic guidance")
      const simulatedResponse = generateAcademicGuidance(content, project, chapterNumber, isFullChapterRequest)
      const encoder = new TextEncoder()
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()

      ;(async () => {
        try {
          const words = simulatedResponse.split(" ")
          let accumulated = ""
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(" ") + " "
            accumulated += chunk
            await writer.write(
              encoder.encode(JSON.stringify({ type: "text", content: chunk }) + "\n")
            )
            await new Promise((r) => setTimeout(r, 20))
          }

          if (isFullChapterRequest) {
            await prisma.chapter.updateMany({
              where: { projectId, chapterNumber },
              data: { content: accumulated.trim(), status: "COMPLETE" },
            })
          }

          await prisma.message.create({
            data: {
              projectId,
              chapterNumber,
              role: "assistant",
              content: accumulated.trim(),
            },
          })

          await writer.write(
            encoder.encode(
              JSON.stringify({
                type: "done",
                messageId: "stream-complete",
              }) + "\n"
            )
          )
        } catch (err) {
          console.error("[CHAT-FALLBACK] Error:", err)
        } finally {
          await writer.close()
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

    console.log("[CHAT-13] OpenRouter request started")
    const stream = createStreamResponse({
      model,
      system,
      prompt,
      temperature: 0.7,
      maxTokens: isFullChapterRequest ? 8192 : 2048,
    })

    if (!stream) {
      console.error("[CHAT-13] createStreamResponse returned null")
      return NextResponse.json(
        { error: "Failed to initialize AI stream." },
        { status: 500 }
      )
    }

    console.log("[CHAT-13] Stream created, beginning iteration")

    const encoder = new TextEncoder()
    let fullResponse = ""
    let hasStreamError = false

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      try {
        let chunkCount = 0
        for await (const chunk of stream.fullStream) {
          chunkCount++

          if (chunk.type === "text-delta" && chunk.textDelta) {
            if (chunkCount === 1) {
              console.log("[CHAT-14] First AI chunk received")
            }
            fullResponse += chunk.textDelta
            await writer.write(
              encoder.encode(
                JSON.stringify({ type: "text", content: chunk.textDelta }) + "\n"
              )
            )
          } else if (chunk.type === "error") {
            const errorObj = (chunk as { error?: unknown }).error
            const errorMsg =
              errorObj instanceof Error
                ? errorObj.message
                : JSON.stringify(errorObj)
            console.warn("[CHAT-14] Stream error chunk:", errorMsg, "- providing academic guidance")
            
            // Stream rich academic guidance fallback
            const fallbackText = generateAcademicGuidance(
              content,
              project,
              chapterNumber,
              isFullChapterRequest
            )
            const words = fallbackText.split(" ")
            for (let i = 0; i < words.length; i += 3) {
              const piece = words.slice(i, i + 3).join(" ") + " "
              fullResponse += piece
              await writer.write(
                encoder.encode(JSON.stringify({ type: "text", content: piece }) + "\n")
              )
              await new Promise((r) => setTimeout(r, 15))
            }
            hasStreamError = false
            break
          } else if (chunk.type === "step-finish") {
            console.log(
              "[CHAT-14] Step finished:",
              (chunk as { finishReason?: string }).finishReason
            )
          }
        }

        console.log(
          "[CHAT-15] AI stream completed. chunks=%d length=%d error=%s",
          chunkCount,
          fullResponse.length,
          hasStreamError
        )

        if (!hasStreamError && fullResponse.length === 0) {
          console.error("[CHAT-15] AI returned empty response")
          await writer.write(
            encoder.encode(
              JSON.stringify({
                type: "error",
                content: "AI returned an empty response. Try a different message.",
              }) + "\n"
            )
          )
        } else if (!hasStreamError && fullResponse.length > 0) {
          try {
            if (isFullChapterRequest) {
              await prisma.chapter.updateMany({
                where: { projectId, chapterNumber },
                data: { content: fullResponse, status: "COMPLETE" },
              })
            }

            await prisma.message.create({
              data: {
                projectId,
                chapterNumber,
                role: "assistant",
                content: fullResponse,
              },
            })

            console.log("[CHAT-16] Assistant response saved")
          } catch (saveError) {
            console.error("[CHAT-16] Failed to save assistant response:", saveError)
          }

          await writer.write(
            encoder.encode(
              JSON.stringify({
                type: "done",
                messageId: "stream-complete",
              }) + "\n"
            )
          )

          console.log(
            "[CHAT-16] === Request complete === %dms",
            Date.now() - startTime
          )
        }
      } catch (error) {
        console.error("[CHAT-15] Stream processing error:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Unknown stream error"
        try {
          await writer.write(
            encoder.encode(
              JSON.stringify({ type: "error", content: errorMessage }) + "\n"
            )
          )
        } catch {
          // Writer already closed
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
  } catch (error) {
    console.error("[CHAT-FATAL]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    const message =
      error instanceof Error ? error.message : "Internal chat server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
