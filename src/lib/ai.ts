import { createOpenAI } from "@ai-sdk/openai"
import { streamText, type CoreMessage } from "ai"

let cachedClient: ReturnType<typeof createOpenAI> | null = null

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || null
}

function getClient() {
  if (cachedClient) return cachedClient

  const apiKey = getApiKey()
  if (!apiKey) {
    console.error(
      "[AI] No API key found. Set OPENROUTER_API_KEY or OPENAI_API_KEY in your Vercel environment variables."
    )
    return null
  }
  cachedClient = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  })
  return cachedClient
}

export function isAIConfigured(): boolean {
  return getClient() !== null
}

export function getAIErrorMessage(): string {
  if (!getApiKey()) {
    return "AI is not configured. Please add OPENROUTER_API_KEY in your Vercel project settings → Environment Variables."
  }
  return ""
}

export function getChatModel() {
  const client = getClient()
  return client ? client("openai/gpt-4o-mini") : null
}

export function getChapterModel() {
  const client = getClient()
  return client ? client("openai/gpt-4o") : null
}

export function getModel() {
  return getChatModel()
}

export function createStreamResponse({
  model,
  system,
  prompt,
  temperature = 0.7,
  maxTokens = 4096,
}: {
  model: ReturnType<typeof getModel>
  system: string
  prompt: string
  temperature?: number
  maxTokens?: number
}) {
  if (!model) return null

  try {
    return streamText({
      model,
      system,
      prompt,
      temperature,
      maxTokens,
    })
  } catch (error) {
    console.error("[AI] Failed to create stream:", error)
    return null
  }
}

export function createChatStreamResponse({
  model,
  system,
  messages,
  temperature = 0.7,
  maxTokens = 4096,
}: {
  model: ReturnType<typeof getModel>
  system: string
  messages: CoreMessage[]
  temperature?: number
  maxTokens?: number
}) {
  if (!model) return null

  try {
    return streamText({
      model,
      system,
      messages,
      temperature,
      maxTokens,
    })
  } catch (error) {
    console.error("[AI] Failed to create chat stream:", error)
    return null
  }
}
