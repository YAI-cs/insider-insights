import OpenAI from 'openai'

const rawUrl = process.env.BACKEND_API_URL ?? 'http://localhost:11434/v1/chat/completions'
const baseURL = rawUrl.endsWith('/chat/completions')
  ? rawUrl.slice(0, -'/chat/completions'.length)
  : rawUrl

export const llmClient = new OpenAI({
  baseURL,
  apiKey: process.env.BACKEND_API_KEY ?? 'not-needed',
})

const MODEL = process.env.BACKEND_MODEL ?? 'hermes'

function extractJSON(raw: string): string {
  // 1. Strip markdown code fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()

  // 2. Find the first [ or { and match to closing ] or }
  const startBracket = raw.indexOf('[')
  const startBrace = raw.indexOf('{')

  if (startBracket === -1 && startBrace === -1) return raw.trim()

  const useArray =
    startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)

  if (useArray) {
    // Find matching closing bracket
    let depth = 0
    let end = -1
    for (let i = startBracket; i < raw.length; i++) {
      if (raw[i] === '[') depth++
      else if (raw[i] === ']') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end !== -1) return raw.slice(startBracket, end + 1)
  } else {
    let depth = 0
    let end = -1
    for (let i = startBrace; i < raw.length; i++) {
      if (raw[i] === '{') depth++
      else if (raw[i] === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end !== -1) return raw.slice(startBrace, end + 1)
  }

  return raw.trim()
}

export async function chatJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const completion = await llmClient.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  })

  const raw = completion.choices[0]?.message?.content ?? '[]'
  const jsonStr = extractJSON(raw)

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // Last resort: try the full raw string
    return JSON.parse(raw) as T
  }
}
