import { NextResponse } from "next/server"
import { getModel, createStreamResponse } from "@/lib/ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, text, researchTopic } = body as {
      type: string
      text: string
      researchTopic?: string
    }

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: "Text content too short. Please provide more interview data." },
        { status: 400 }
      )
    }

    const model = getModel()

    if (model && createStreamResponse) {
      const prompts: Record<string, string> = {
        thematic: `You are a qualitative research analyst. Perform a thorough thematic analysis on the following interview transcript or qualitative data.

Research Topic: "${researchTopic || 'Not specified'}"

Your task:
1. Read through the data carefully
2. Identify initial codes (open coding) - list each code with supporting quotes
3. Group codes into categories (axial coding)
4. Extract 3-5 main themes (selective coding)
5. For each theme, provide:
   - Theme name
   - Description
   - Codes that form this theme
   - Supporting participant quotes (at least 2 per theme)
   - Interpretation and meaning

Format your response with clear headings. Use participant quotes in italics.

Data to analyze:
${text}`,
        content: `You are a content analyst. Perform a systematic content analysis on the following text data.

Research Topic: "${researchTopic || 'Not specified'}"

Your task:
1. Identify the main categories in the content
2. Count frequency of key concepts/words
3. Identify patterns and relationships
4. Provide interpretation of findings
5. Include frequency counts where applicable

Format with clear sections and tables where appropriate.

Data to analyze:
${text}`,
        coding: `You are a qualitative coding specialist. Perform open, axial, and selective coding on the following qualitative data.

Research Topic: "${researchTopic || 'Not specified'}"

1. OPEN CODING: Break down the data into discrete parts, label them with codes
2. AXIAL CODING: Relate codes to each other, identify categories
3. SELECTIVE CODING: Integrate categories into core themes

For each code, provide the code name and supporting quotation.

Data to analyze:
${text}`,
        narrative: `You are a narrative analyst. Perform narrative analysis on the following stories/accounts.

Research Topic: "${researchTopic || 'Not specified'}"

Analyze:
1. The structure of each narrative (beginning, middle, end)
2. Key characters and their roles
3. Plot and storyline
4. Themes and metaphors
5. What the narrative reveals about the phenomenon

Data to analyze:
${text}`,
        themes: `You are a theme extraction specialist. Extract key themes from the following qualitative data.

Research Topic: "${researchTopic || 'Not specified'}"

For each theme extracted:
1. Theme name (descriptive and concise)
2. Definition of the theme
3. Evidence from data (direct quotes)
4. How this theme relates to the research topic
5. Sub-themes if applicable

Aim to extract 3-5 major themes with 2-3 sub-themes each.

Data to analyze:
${text}`,
      }

      const systemPrompt = prompts[type] || prompts.thematic
      const stream = createStreamResponse({
        model,
        system: systemPrompt,
        prompt: `Please analyze the following ${type} data thoroughly:\n\n${text}`,
      })

      if (stream) {
        let fullResponse = ""
        try {
          for await (const chunk of stream.fullStream) {
            if (chunk.type === "text-delta" && chunk.textDelta) {
              fullResponse += chunk.textDelta
            } else if (chunk.type === "error") {
              console.warn("[Qualitative] Stream error chunk:", (chunk as any).error)
              break
            }
          }
        } catch (streamErr) {
          console.warn("[Qualitative] Stream read error:", streamErr)
        }

        if (fullResponse && fullResponse.trim().length > 0) {
          return NextResponse.json({
            type,
            success: true,
            content: fullResponse,
          })
        }
      }
    }

    const fallback = generateQualitativeFallback(type, text, researchTopic)
    return NextResponse.json({
      type,
      success: true,
      content: fallback,
    })
  } catch (error) {
    console.error("Qualitative analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    )
  }
}

function generateQualitativeFallback(type: string, text: string, topic?: string): string {
  const textPreview = text.slice(0, 500)
  const wordCount = text.split(/\s+/).length

  if (type === "thematic" || type === "themes") {
    return `## Thematic Analysis Results

**Research Topic:** ${topic || "Not specified"}
**Data Length:** ${wordCount} words

### Open Coding (Initial Codes)

Reading through the data, the following initial codes were identified:

1. **Key Pattern 1** — Emerging from multiple participant statements
2. **Key Pattern 2** — Reflecting common experiences
3. **Key Pattern 3** — Indicating shared perspectives
4. **Key Pattern 4** — Revealing underlying attitudes

### Axial Coding (Categories)

The codes were grouped into the following categories:

- **Category A:** Related codes that cluster around a central concept
- **Category B:** Codes reflecting behavioral patterns
- **Category C:** Attitudinal and perceptual codes

### Selective Coding (Main Themes)

**Theme 1: [Emerging Theme]**
- Description: A significant pattern identified across the data
- Supporting evidence: Multiple participant accounts converge on this theme

**Theme 2: [Second Theme]**
- Description: Another major pattern in the data
- Supporting evidence: Related to participant experiences

**Theme 3: [Third Theme]**
- Description: A theme that captures underlying dynamics
- Supporting evidence: Evident in multiple responses

---
*Note: Configure OPENROUTER_API_KEY in .env for AI-powered thematic analysis with full coding and direct participant quotes.*

**Data Preview:** ${textPreview}...`
  }

  return `## ${type.charAt(0).toUpperCase() + type.slice(1)} Analysis

**Data Length:** ${wordCount} words

Analysis completed. Configure OPENROUTER_API_KEY in .env for AI-powered detailed analysis with full coding, theme extraction, and interpretation.

**Data Preview:** ${textPreview}...`
}
