import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

let cachedClient: ReturnType<typeof createOpenAI> | null = null

function getClient() {
  if (!cachedClient) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return null
    cachedClient = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    })
  }
  return cachedClient
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

  return streamText({
    model,
    system,
    prompt,
    temperature,
    maxTokens,
  })
}
