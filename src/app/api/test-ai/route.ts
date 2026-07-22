import { NextResponse } from "next/server"
import { getModel, createStreamResponse, isAIConfigured, getAIErrorMessage } from "@/lib/ai"
import { generateText } from "ai"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("mode") || "both"

  try {
    if (!isAIConfigured()) {
      return NextResponse.json({ error: getAIErrorMessage() || "AI not configured" }, { status: 500 })
    }

    const model = getModel()
    if (!model) {
      return NextResponse.json({ error: "getModel() returned null" }, { status: 500 })
    }

    const results: Record<string, unknown> = { apiKeyPresent: true, modelPresent: true }

    // Test 1: generateText (non-streaming)
    if (mode === "both" || mode === "generate") {
      try {
        const { text } = await generateText({
          model,
          system: "You are a helpful assistant. Reply concisely.",
          prompt: "Say hello in one sentence.",
        })
        results.generateText = { success: true, response: text, length: text.length }
      } catch (err) {
        results.generateText = {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }

    // Test 2: streamText (streaming)
    if (mode === "both" || mode === "stream") {
      try {
        const stream = createStreamResponse({
          model,
          system: "You are a helpful assistant. Reply concisely.",
          prompt: "Say hello in one sentence.",
        })

        if (!stream) {
          results.streamText = { success: false, error: "createStreamResponse returned null" }
        } else {
          let fullResponse = ""
          let chunkTypes: string[] = []
          for await (const chunk of stream.fullStream) {
            chunkTypes.push(chunk.type)
            if (chunk.type === "text-delta" && chunk.textDelta) {
              fullResponse += chunk.textDelta
            }
          }
          results.streamText = {
            success: true,
            response: fullResponse,
            length: fullResponse.length,
            chunkTypes,
          }
        }
      } catch (err) {
        results.streamText = {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Test AI error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
