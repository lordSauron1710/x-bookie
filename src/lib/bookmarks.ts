import type { BookmarkRecord } from '../../shared/contracts.ts'

export type InterestDefinition = {
  id: string
  label: string
  description: string
  keywords: string[]
  tint: string
}

export type AnalyzedBookmark = BookmarkRecord & {
  matchedInterestId: string
  matchedInterestLabel: string
  confidence: number
  signals: string[]
  contentType: string
  actionLane: string
  reason: string
  isManual: boolean
}

export type InterestStat = {
  interestId: string
  label: string
  description: string
  tint: string
  count: number
  share: number
  averageConfidence: number
}

export type AnalysisSummary = {
  total: number
  categorized: number
  uncategorized: number
  averageConfidence: number
  topInterestLabel: string
  topInterestShare: number
  hottestActionLane: string
  momentumNote: string
  actionNote: string
  signalWords: string[]
}

export const starterInterests: InterestDefinition[] = [
  {
    id: 'ai-ml',
    label: 'AI & ML',
    description: 'Agents, LLMs, prompts, model tooling, and applied research.',
    keywords: [
      'ai',
      'ml',
      'llm',
      'gpt',
      'agent',
      'agents',
      'prompt',
      'reasoning',
      'model',
      'rag',
      'inference',
      'embedding',
      'eval',
    ],
    tint: '#ee7a4d',
  },
  {
    id: 'product-design',
    label: 'Product & Design',
    description: 'UX, onboarding, interaction design, research, and product taste.',
    keywords: [
      'product',
      'design',
      'ux',
      'ui',
      'onboarding',
      'research',
      'interface',
      'workflow',
      'customer',
      'prototype',
      'design system',
      'governance',
    ],
    tint: '#7c9fda',
  },
  {
    id: 'dev-tools',
    label: 'Dev Tools',
    description: 'Developer workflows, repos, infra, automation, and engineering velocity.',
    keywords: [
      'developer',
      'dev',
      'tooling',
      'repo',
      'github',
      'code',
      'cli',
      'sdk',
      'infra',
      'observability',
      'latency',
      'copilot',
      'cursor',
      'debug',
    ],
    tint: '#8ebc75',
  },
  {
    id: 'startups-growth',
    label: 'Startups & Growth',
    description: 'Distribution, go-to-market, loops, pricing, and company building.',
    keywords: [
      'startup',
      'distribution',
      'growth',
      'go-to-market',
      'landing page',
      'pricing',
      'wedge',
      'customer language',
      'referral',
      'launch',
      'ship',
      'beta',
      'founder',
    ],
    tint: '#f0bf57',
  },
  {
    id: 'investing-markets',
    label: 'Investing & Markets',
    description: 'Public markets, SaaS multiples, capital allocation, and business quality.',
    keywords: [
      'market',
      'markets',
      'invest',
      'investing',
      'capital',
      'multiple',
      'multiples',
      'cash flow',
      'burn',
      'saas',
      'durability',
      'buffett',
      'stocks',
    ],
    tint: '#d76767',
  },
  {
    id: 'writing-ideas',
    label: 'Writing & Ideas',
    description: 'Thinking, writing, essays, clarity, communication, and synthesis.',
    keywords: [
      'write',
      'writing',
      'essay',
      'explanation',
      'ideas',
      'thought',
      'clarity',
      'language',
      'thread',
      'story',
      'taste',
      'synthesis',
    ],
    tint: '#9b7ae8',
  },
]

const uncategorizedInterest: InterestDefinition = {
  id: 'review-later',
  label: 'Review Later',
  description: 'Bookmarks that need more context or do not match your current interests yet.',
  keywords: [],
  tint: '#72808f',
}

const textPaths = [
  ['text'],
  ['full_text'],
  ['tweet_text'],
  ['legacy', 'full_text'],
  ['legacy', 'text'],
  ['tweet', 'full_text'],
  ['tweet', 'text'],
  ['tweet', 'legacy', 'full_text'],
  ['tweet', 'legacy', 'text'],
  ['note_tweet', 'note_tweet_results', 'result', 'text'],
  ['content', 'itemContent', 'tweet_results', 'result', 'legacy', 'full_text'],
]

const authorPaths = [
  ['author'],
  ['name'],
  ['user', 'name'],
  ['legacy', 'name'],
  ['legacy', 'user_name'],
  ['core', 'user_results', 'result', 'legacy', 'name'],
  [
    'content',
    'itemContent',
    'tweet_results',
    'result',
    'core',
    'user_results',
    'result',
    'legacy',
    'name',
  ],
]

const handlePaths = [
  ['handle'],
  ['username'],
  ['screen_name'],
  ['user', 'screen_name'],
  ['legacy', 'screen_name'],
  ['core', 'user_results', 'result', 'legacy', 'screen_name'],
  [
    'content',
    'itemContent',
    'tweet_results',
    'result',
    'core',
    'user_results',
    'result',
    'legacy',
    'screen_name',
  ],
]

const urlPaths = [
  ['url'],
  ['tweetUrl'],
  ['tweet_url'],
  ['expanded_url'],
  ['legacy', 'expanded_url'],
  ['entities', 'urls', 0, 'expanded_url'],
]

const createdAtPaths = [
  ['created_at'],
  ['createdAt'],
  ['saved_at'],
  ['savedAt'],
  ['legacy', 'created_at'],
]

const idPaths = [['id'], ['id_str'], ['rest_id'], ['tweet_id']]

const contentTypes = [
  {
    label: 'Playbook',
    patterns: ['how to', 'guide', 'tutorial', 'thread', 'checklist'],
  },
  {
    label: 'Launch',
    patterns: ['launch', 'ship', 'beta', 'released', 'new repo'],
  },
  {
    label: 'Market Note',
    patterns: ['market', 'markets', 'multiple', 'capital', 'stocks'],
  },
  {
    label: 'Reference',
    patterns: ['github.com', 'docs', 'framework', 'sdk', 'api'],
  },
  {
    label: 'Career',
    patterns: ['hiring', 'role', 'job', 'team'],
  },
]

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toSentenceCase(value: string) {
  if (!value) return value
  return value[0].toUpperCase() + value.slice(1)
}

function safeAverage(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getByPath(value: unknown, path: Array<string | number>) {
  let current: unknown = value

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (typeof key === 'number') {
      if (!Array.isArray(current)) {
        return undefined
      }
      current = current[key]
      continue
    }

    if (typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current
}

function firstString(value: unknown, paths: Array<Array<string | number>>) {
  for (const path of paths) {
    const candidate = getByPath(value, path)
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

function normalizeHandle(value: string) {
  return value.replace(/^@+/, '').trim()
}

function hashSeed(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function tokenizeLabel(label: string) {
  return Array.from(
    new Set(
      normalizeText(label)
        .split(/[^a-z0-9]+/)
        .filter((part) => part.length > 2),
    ),
  )
}

function dedupeKeywords(keywords: string[]) {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => normalizeText(keyword))
        .filter(Boolean),
    ),
  )
}

function buildBookmarkKey(bookmark: BookmarkRecord) {
  return bookmark.url || `${bookmark.handle}-${bookmark.id}` || bookmark.text
}

function buildUrl(handle: string, id: string) {
  if (!handle || !id) return ''
  return `https://x.com/${handle}/status/${id}`
}

function toBookmarkRecord(
  partial: Partial<BookmarkRecord>,
  fallbackIndex: number,
): BookmarkRecord | null {
  const text = partial.text?.trim() ?? ''
  if (text.length < 16) return null

  const handle = normalizeHandle(partial.handle ?? '')
  const id =
    partial.id?.trim() ||
    `bookmark-${fallbackIndex}-${slugify(text.slice(0, 32)) || fallbackIndex}`

  return {
    id,
    text,
    author: partial.author?.trim() || 'Unknown author',
    handle,
    url: partial.url?.trim() || buildUrl(handle, id),
    createdAt: partial.createdAt?.trim() || null,
  }
}

function extractBookmarkFromNode(
  node: Record<string, unknown>,
  index: number,
): BookmarkRecord | null {
  const text = firstString(node, textPaths)
  if (!text) return null

  const authorCandidate = firstString(node, authorPaths)
  const handleCandidate = firstString(node, handlePaths)
  const urlCandidate = firstString(node, urlPaths)
  const createdAtCandidate = firstString(node, createdAtPaths)
  const idCandidate = firstString(node, idPaths)

  return toBookmarkRecord(
    {
      id: idCandidate,
      text,
      author: authorCandidate,
      handle: handleCandidate,
      url: urlCandidate,
      createdAt: createdAtCandidate,
    },
    index,
  )
}

function parseCsvRows(input: string) {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let insideQuotes = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (char === ',' && !insideQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(current)
      current = ''
      if (row.some((cell) => cell.trim())) {
        rows.push(row)
      }
      row = []
      continue
    }

    current += char
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current)
    if (row.some((cell) => cell.trim())) {
      rows.push(row)
    }
  }

  return rows
}

function parseCsvBookmarks(input: string) {
  const rows = parseCsvRows(input)
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => normalizeText(header))
  const textFields = ['text', 'full_text', 'tweet_text', 'content', 'body', 'tweet']
  const authorFields = ['author', 'name', 'user']
  const handleFields = ['handle', 'screen_name', 'username']
  const urlFields = ['url', 'link', 'tweet_url']
  const dateFields = ['created_at', 'createdat', 'saved_at', 'savedat', 'date']
  const idFields = ['id', 'id_str', 'tweet_id']

  return rows
    .slice(1)
    .map((cells, index) => {
      const lookup = (fieldNames: string[]) => {
        const headerIndex = headers.findIndex((header) => fieldNames.includes(header))
        return headerIndex >= 0 ? cells[headerIndex] ?? '' : ''
      }

      return toBookmarkRecord(
        {
          id: lookup(idFields),
          text: lookup(textFields),
          author: lookup(authorFields),
          handle: lookup(handleFields),
          url: lookup(urlFields),
          createdAt: lookup(dateFields),
        },
        index,
      )
    })
    .filter((bookmark): bookmark is BookmarkRecord => bookmark !== null)
}

function parsePlainTextBookmarks(input: string) {
  const normalized = input.trim()
  if (!normalized) return []

  const blocks = normalized.includes('\n\n')
    ? normalized.split(/\n\s*\n+/)
    : normalized.split('\n').filter((line) => line.trim())

  return blocks
    .map((block, index) => {
      const trimmedBlock = block.trim()
      if (!trimmedBlock) return null
      const urlMatch = trimmedBlock.match(/https?:\/\/\S+/)
      const url = urlMatch?.[0] ?? ''
      const text = trimmedBlock.replace(url, '').replace(/\s+/g, ' ').trim()
      return toBookmarkRecord(
        {
          id: `pasted-${index + 1}`,
          text,
          author: 'Pasted bookmark',
          handle: '',
          url,
          createdAt: null,
        },
        index,
      )
    })
    .filter((bookmark): bookmark is BookmarkRecord => bookmark !== null)
}

function parseJsonBookmarks(input: string) {
  const parsed = JSON.parse(input) as unknown
  const visited = new WeakSet<object>()
  const records = new Map<string, BookmarkRecord>()
  let index = 0

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return
    }

    if (visited.has(value as object)) {
      return
    }

    visited.add(value as object)

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    const node = value as Record<string, unknown>
    const bookmark = extractBookmarkFromNode(node, index)
    if (bookmark) {
      index += 1
      records.set(buildBookmarkKey(bookmark), bookmark)
    }

    Object.values(node).forEach(visit)
  }

  visit(parsed)

  return Array.from(records.values())
}

function detectContentType(bookmark: BookmarkRecord) {
  const text = normalizeText(`${bookmark.text} ${bookmark.url}`)

  const matched = contentTypes.find(({ patterns }) =>
    patterns.some((pattern) => text.includes(normalizeText(pattern))),
  )

  if (matched) return matched.label
  if (bookmark.url) return 'Read Later'
  if (bookmark.text.length > 220) return 'Deep Read'
  return 'Quick Hit'
}

function detectActionLane(bookmark: BookmarkRecord, interest: InterestDefinition) {
  const text = normalizeText(bookmark.text)

  if (/(build|ship|prototype|repo|tool|automation)/.test(text)) {
    return 'Build'
  }
  if (/(market|capital|stocks|pricing|multiple|burn)/.test(text)) {
    return 'Track'
  }
  if (/(write|writing|essay|idea|explanation|language)/.test(text)) {
    return 'Reflect'
  }
  if (/(guide|tutorial|thread|docs|how to)/.test(text)) {
    return 'Study'
  }
  if (interest.id === uncategorizedInterest.id) {
    return 'Review'
  }
  return 'Read'
}

function scoreInterest(bookmark: BookmarkRecord, interest: InterestDefinition) {
  const haystacks = [
    normalizeText(bookmark.text),
    normalizeText(bookmark.author),
    normalizeText(bookmark.handle),
    normalizeText(bookmark.url),
  ]

  let score = 0
  const signals = new Set<string>()

  for (const keyword of interest.keywords) {
    const normalizedKeyword = normalizeText(keyword)
    if (!normalizedKeyword) continue

    const pattern =
      normalizedKeyword.length > 2
        ? new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, 'i')
        : new RegExp(escapeRegExp(normalizedKeyword), 'i')

    let matches = 0

    haystacks.forEach((haystack, index) => {
      if (!haystack) return
      if (pattern.test(haystack)) {
        matches += index === 0 ? 2 : 1
      }
    })

    if (matches > 0) {
      score += matches
      signals.add(toSentenceCase(keyword))
    }
  }

  return {
    score,
    signals: Array.from(signals).slice(0, 4),
  }
}

function describeReason(signals: string[], interestLabel: string, contentType: string) {
  if (signals.length === 0) {
    return `No strong signal matched your active interests, so it stayed in ${interestLabel.toLowerCase()}.`
  }

  const joinedSignals = signals.join(', ')
  return `${contentType} with strong overlap on ${joinedSignals}, so it fits ${interestLabel}.`
}

export function createCustomInterest(label: string): InterestDefinition | null {
  const trimmed = label.trim()
  if (!trimmed) return null

  const seed = hashSeed(trimmed)
  const hue = seed % 360
  const keywords = dedupeKeywords([trimmed, ...tokenizeLabel(trimmed)])

  return {
    id: `custom-${slugify(trimmed)}`,
    label: trimmed,
    description: 'Custom interest defined from your own label.',
    keywords,
    tint: `hsl(${hue} 70% 62%)`,
  }
}

export function parseBookmarkInput(input: string, sourceName = '') {
  const trimmed = input.trim()
  if (!trimmed) return []

  const lowerName = sourceName.toLowerCase()

  if (lowerName.endsWith('.csv')) {
    return parseCsvBookmarks(trimmed)
  }

  if (lowerName.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const jsonBookmarks = parseJsonBookmarks(trimmed)
      if (jsonBookmarks.length > 0) {
        return jsonBookmarks
      }
    } catch {
      if (!lowerName.endsWith('.json')) {
        return parsePlainTextBookmarks(trimmed)
      }
      throw new Error('The JSON file could not be parsed.')
    }
  }

  const csvBookmarks = parseCsvBookmarks(trimmed)
  if (csvBookmarks.length > 0) {
    return csvBookmarks
  }

  return parsePlainTextBookmarks(trimmed)
}

export function analyzeBookmarks(
  bookmarks: BookmarkRecord[],
  interests: InterestDefinition[],
  overrides: Record<string, string> = {},
) {
  const activeInterests = interests.length > 0 ? interests : [uncategorizedInterest]
  const interestLookup = new Map(
    [...activeInterests, uncategorizedInterest].map((interest) => [interest.id, interest]),
  )

  const analyzed = bookmarks.map<AnalyzedBookmark>((bookmark) => {
    const scored = activeInterests
      .map((interest) => ({
        interest,
        ...scoreInterest(bookmark, interest),
      }))
      .sort((left, right) => right.score - left.score)

    const winner = scored[0]
    const runnerUpScore = scored[1]?.score ?? 0
    const shouldCategorize = winner && winner.score > 0
    const defaultInterest = shouldCategorize ? winner.interest : uncategorizedInterest
    const baseConfidence = shouldCategorize
      ? clamp(0.48 + winner.score / 10 + (winner.score - runnerUpScore) / 12, 0.42, 0.95)
      : 0.34
    const overrideId = overrides[bookmark.id]
    const finalInterest = overrideId ? interestLookup.get(overrideId) ?? defaultInterest : defaultInterest
    const contentType = detectContentType(bookmark)
    const actionLane = detectActionLane(bookmark, finalInterest)
    const signals =
      finalInterest.id === defaultInterest.id || !winner ? winner?.signals ?? [] : tokenizeLabel(finalInterest.label)

    return {
      ...bookmark,
      matchedInterestId: finalInterest.id,
      matchedInterestLabel: finalInterest.label,
      confidence: overrideId ? 0.99 : baseConfidence,
      signals,
      contentType,
      actionLane,
      reason: describeReason(signals, finalInterest.label, contentType),
      isManual: Boolean(overrideId),
    }
  })

  const statSeed = [...activeInterests, uncategorizedInterest].map<InterestStat>((interest) => {
    const matches = analyzed.filter((bookmark) => bookmark.matchedInterestId === interest.id)
    return {
      interestId: interest.id,
      label: interest.label,
      description: interest.description,
      tint: interest.tint,
      count: matches.length,
      share: analyzed.length > 0 ? matches.length / analyzed.length : 0,
      averageConfidence: safeAverage(matches.map((match) => match.confidence)),
    }
  })

  const stats = statSeed
    .filter((stat) => stat.count > 0)
    .sort((left, right) => right.count - left.count)

  const categorized = analyzed.filter(
    (bookmark) => bookmark.matchedInterestId !== uncategorizedInterest.id,
  ).length
  const averageConfidence = safeAverage(analyzed.map((bookmark) => bookmark.confidence))
  const topInterest = stats[0] ?? {
    label: uncategorizedInterest.label,
    share: 0,
  }

  const lanes = analyzed.reduce<Record<string, number>>((counts, bookmark) => {
    counts[bookmark.actionLane] = (counts[bookmark.actionLane] ?? 0) + 1
    return counts
  }, {})

  const hottestActionLane =
    Object.entries(lanes).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Review'

  const signalWords = Array.from(
    analyzed.reduce<Map<string, number>>((counts, bookmark) => {
      bookmark.signals.forEach((signal) => {
        counts.set(signal, (counts.get(signal) ?? 0) + 1)
      })
      return counts
    }, new Map()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([word]) => word)

  const summary: AnalysisSummary = {
    total: analyzed.length,
    categorized,
    uncategorized: analyzed.length - categorized,
    averageConfidence,
    topInterestLabel: topInterest.label,
    topInterestShare: topInterest.share,
    hottestActionLane,
    momentumNote:
      topInterest.share > 0.35
        ? `${topInterest.label} is dominating your saves right now.`
        : 'Your bookmarks are spread across several themes, which is healthy for discovery.',
    actionNote:
      hottestActionLane === 'Build'
        ? 'A large share of these bookmarks look ready to turn into experiments.'
        : hottestActionLane === 'Study'
          ? 'Most of this queue looks learning-heavy, so a reading sprint would pay off.'
          : `Your biggest next-step cluster is "${hottestActionLane}".`,
    signalWords,
  }

  return {
    bookmarks: analyzed,
    stats,
    summary,
    uncategorizedInterest,
  }
}
