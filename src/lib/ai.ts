import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"

let cachedGeminiClient: ReturnType<typeof createGoogleGenerativeAI> | null = null
let cachedOpenAIClient: ReturnType<typeof createOpenAI> | null = null
let activeProvider: "gemini" | "openai" | "openrouter" | null = null

export function getApiKey(): string | null {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
  if (geminiKey && geminiKey.length > 10) return geminiKey

  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey && openRouterKey.length > 10) return openRouterKey

  const openAIKey = process.env.OPENAI_API_KEY
  if (openAIKey && openAIKey.length > 15 && !openAIKey.includes("...")) return openAIKey

  return null
}

function initProvider() {
  if (activeProvider) return

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
  if (geminiKey && geminiKey.length > 10) {
    cachedGeminiClient = createGoogleGenerativeAI({
      apiKey: geminiKey,
    })
    activeProvider = "gemini"
    return
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey && openRouterKey.length > 10) {
    cachedOpenAIClient = createOpenAI({
      apiKey: openRouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      compatibility: "compatible",
    })
    activeProvider = "openrouter"
    return
  }

  const openAIKey = process.env.OPENAI_API_KEY
  if (openAIKey && openAIKey.length > 15 && !openAIKey.includes("...")) {
    cachedOpenAIClient = createOpenAI({
      apiKey: openAIKey,
    })
    activeProvider = "openai"
    return
  }
}

export function isAIConfigured(): boolean {
  return getApiKey() !== null
}

export function getAIErrorMessage(): string {
  if (!getApiKey()) {
    return "AI is not configured. Add GEMINI_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY in Settings → Environment Variables."
  }
  return ""
}

export function getChatModel(): any {
  initProvider()
  if (activeProvider === "gemini" && cachedGeminiClient) {
    return cachedGeminiClient("gemini-2.5-flash")
  }
  if (activeProvider === "openrouter" && cachedOpenAIClient) {
    return cachedOpenAIClient("openai/gpt-4o-mini")
  }
  if (activeProvider === "openai" && cachedOpenAIClient) {
    return cachedOpenAIClient("gpt-4o-mini")
  }
  return null
}

export function getChapterModel(): any {
  initProvider()
  if (activeProvider === "gemini" && cachedGeminiClient) {
    return cachedGeminiClient("gemini-2.5-flash")
  }
  if (activeProvider === "openrouter" && cachedOpenAIClient) {
    return cachedOpenAIClient("openai/gpt-4o")
  }
  if (activeProvider === "openai" && cachedOpenAIClient) {
    return cachedOpenAIClient("gpt-4o")
  }
  return null
}

export function getModel(): any {
  return getChatModel()
}

export type StreamResult = ReturnType<typeof streamText>

export function createStreamResponse({
  model,
  system,
  prompt,
  temperature = 0.7,
  maxTokens = 4096,
}: {
  model: any
  system: string
  prompt: string
  temperature?: number
  maxTokens?: number
}): StreamResult | null {
  if (!model) return null
  return streamText({ model, system, prompt, temperature, maxTokens })
}

