import type {
  BookmarkClassificationMode,
  BookmarkClassifierInterest,
  BookmarkModelSuggestion,
  BookmarkRecord,
} from '../../shared/contracts.js'
import { serverConfig } from '../config.js'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const CLASSIFICATION_BATCH_SIZE = 24

type ResponsesApiResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

type ModelClassificationPayload = {
  items: Array<{
    bookmarkId: string
    interestId: string | null
    confidence: number
    signals: string[]
    contentType: string
    actionLane: string
    reason: string
  }>
}

type ClassifierDependencies = {
  fetchImpl?: typeof fetch
}

function classifierSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            bookmarkId: { type: 'string' },
            interestId: {
              anyOf: [{ type: 'string' }, { type: 'null' }],
            },
            confidence: { type: 'number' },
            signals: {
              type: 'array',
              items: { type: 'string' },
            },
            contentType: { type: 'string' },
            actionLane: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['bookmarkId', 'interestId', 'confidence', 'signals', 'contentType', 'actionLane', 'reason'],
        },
      },
    },
    required: ['items'],
  }
}

function buildClassifierPrompt(bookmarks: BookmarkRecord[], interests: BookmarkClassifierInterest[]) {
  return JSON.stringify(
    {
      task: 'Classify X bookmarks against the provided interest taxonomy.',
      rules: [
        'Return exactly one result per bookmark.',
        'Only use an interestId from the provided interests when there is a clear fit; otherwise use null.',
        'Keep confidence between 0 and 1.',
        'signals should be short evidence phrases pulled from the bookmark meaning, not whole paragraphs.',
        'contentType should be a short label like Playbook, Launch, Market Note, Reference, Deep Read, or Quick Hit.',
        'actionLane should be a short next-step label like Build, Track, Study, Reflect, Read, or Review.',
        'reason should be one concise sentence.',
      ],
      interests: interests.map((interest) => ({
        id: interest.id,
        label: interest.label,
        description: interest.description,
        keywords: interest.keywords,
      })),
      bookmarks: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        text: bookmark.text,
        author: bookmark.author,
        handle: bookmark.handle,
        url: bookmark.url,
      })),
    },
    null,
    2,
  )
}

function chunkBookmarks(bookmarks: BookmarkRecord[]) {
  const chunks: BookmarkRecord[][] = []

  for (let index = 0; index < bookmarks.length; index += CLASSIFICATION_BATCH_SIZE) {
    chunks.push(bookmarks.slice(index, index + CLASSIFICATION_BATCH_SIZE))
  }

  return chunks
}

function extractOutputText(response: ResponsesApiResponse) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text
  }

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string' && content.text.trim()) {
        return content.text
      }
    }
  }

  throw new Error('OpenAI did not return classifier output text.')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeSuggestion(
  suggestion: ModelClassificationPayload['items'][number],
  interestIds: Set<string>,
): BookmarkModelSuggestion {
  return {
    bookmarkId: suggestion.bookmarkId,
    interestId: suggestion.interestId && interestIds.has(suggestion.interestId) ? suggestion.interestId : null,
    confidence: clamp(suggestion.confidence, 0, 1),
    signals: suggestion.signals.filter(Boolean).slice(0, 4),
    contentType: suggestion.contentType.trim() || 'Read Later',
    actionLane: suggestion.actionLane.trim() || 'Review',
    reason: suggestion.reason.trim() || 'Model classification did not return a reason.',
  }
}

async function classifyBatch(
  bookmarks: BookmarkRecord[],
  interests: BookmarkClassifierInterest[],
  dependencies: ClassifierDependencies,
) {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const response = await fetchImpl(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${serverConfig.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: serverConfig.OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You classify saved X bookmarks against a user-defined interest profile. Be conservative and structured.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildClassifierPrompt(bookmarks, interests),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'bookmark_classifier_result',
          schema: classifierSchema(),
          strict: true,
        },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI classifier failed (${response.status}): ${text.slice(0, 180)}`)
  }

  const payload = (await response.json()) as ResponsesApiResponse
  const parsed = JSON.parse(extractOutputText(payload)) as ModelClassificationPayload
  const interestIds = new Set(interests.map((interest) => interest.id))

  return parsed.items.map((item) => sanitizeSuggestion(item, interestIds))
}

export function getClassificationMode(config: typeof serverConfig = serverConfig): BookmarkClassificationMode {
  return config.OPENAI_API_KEY ? 'model' : 'heuristic'
}

export function getClassifierModel(config: typeof serverConfig = serverConfig) {
  return config.OPENAI_API_KEY ? config.OPENAI_MODEL : null
}

export async function classifyBookmarks(
  bookmarks: BookmarkRecord[],
  interests: BookmarkClassifierInterest[],
  dependencies: ClassifierDependencies = {},
) {
  if (!serverConfig.OPENAI_API_KEY) {
    throw new Error('OpenAI classifier is not configured.')
  }

  if (bookmarks.length === 0 || interests.length === 0) {
    return []
  }

  const results: BookmarkModelSuggestion[] = []

  for (const batch of chunkBookmarks(bookmarks)) {
    const classified = await classifyBatch(batch, interests, dependencies)
    results.push(...classified)
  }

  return results
}
