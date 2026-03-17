import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  BookmarkClassificationMode,
  BookmarkModelSuggestion,
  BookmarkRecord,
} from '../../shared/contracts.ts'
import type { InterestDefinition } from '../lib/bookmarks'
import { classifyBookmarks } from '../lib/api'

type UseBookmarkClassificationOptions = {
  bookmarks: BookmarkRecord[]
  interests: InterestDefinition[]
  classificationMode: BookmarkClassificationMode
  isAuthenticated: boolean
}

function toSuggestionMap(items: BookmarkModelSuggestion[]) {
  return Object.fromEntries(items.map((item) => [item.bookmarkId, item]))
}

export function useBookmarkClassification({
  bookmarks,
  interests,
  classificationMode,
  isAuthenticated,
}: UseBookmarkClassificationOptions) {
  const [suggestions, setSuggestions] = useState<Record<string, BookmarkModelSuggestion>>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const requestIdRef = useRef(0)

  const bookmarkSignature = useMemo(
    () => bookmarks.map((bookmark) => `${bookmark.id}:${bookmark.text}:${bookmark.url}`).join('|'),
    [bookmarks],
  )
  const interestSignature = useMemo(
    () =>
      interests
        .map((interest) => `${interest.id}:${interest.label}:${interest.keywords.join(',')}`)
        .join('|'),
    [interests],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      setSuggestions({})
      setIsClassifying(false)
      setStatusMessage(null)
      return
    }

    if (classificationMode !== 'model') {
      setSuggestions({})
      setIsClassifying(false)
      setStatusMessage('Heuristic classifier active. Add OpenAI server config to enable model-backed sorting.')
      return
    }

    if (bookmarks.length === 0 || interests.length === 0) {
      setSuggestions({})
      setIsClassifying(false)
      setStatusMessage('Model-backed classifier is ready. Sync bookmarks and keep interests selected to use it.')
      return
    }

    const currentRequestId = requestIdRef.current + 1
    requestIdRef.current = currentRequestId
    const timeoutId = window.setTimeout(async () => {
      setIsClassifying(true)

      try {
        const response = await classifyBookmarks({
          bookmarks,
          interests: interests.map(({ id, label, description, keywords }) => ({
            id,
            label,
            description,
            keywords,
          })),
        })

        if (requestIdRef.current !== currentRequestId) {
          return
        }

        setSuggestions(toSuggestionMap(response.items))
        setStatusMessage(`Model-backed classifier active with ${response.model ?? 'configured model'} suggestions.`)
      } catch (error) {
        if (requestIdRef.current !== currentRequestId) {
          return
        }

        setSuggestions({})
        setStatusMessage(error instanceof Error ? error.message : 'Model-backed classification failed.')
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsClassifying(false)
        }
      }
    }, 180)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [bookmarkSignature, bookmarks, classificationMode, interestSignature, interests, isAuthenticated])

  return {
    suggestions,
    statusMessage,
    isClassifying,
  }
}
