import { useEffect, useRef, useState } from 'react'

import { createCustomInterest, starterInterests, type InterestDefinition } from '../lib/bookmarks'
import { getProfileStorageKeys, readStoredJson, writeStoredJson } from '../lib/storage'

export function useInterestProfile(scope: string) {
  const [activeInterests, setActiveInterests] = useState<InterestDefinition[]>(() =>
    readStoredJson(getProfileStorageKeys(scope).interests, starterInterests),
  )
  const [overrides, setOverrides] = useState<Record<string, string>>(() =>
    readStoredJson(getProfileStorageKeys(scope).overrides, {}),
  )
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const isHydrating = useRef(true)

  useEffect(() => {
    isHydrating.current = true

    const storageKeys = getProfileStorageKeys(scope)
    const nextActiveInterests = readStoredJson(storageKeys.interests, starterInterests)
    const nextOverrides = readStoredJson(storageKeys.overrides, {})
    const timeoutId = window.setTimeout(() => {
      setActiveInterests(nextActiveInterests)
      setOverrides(nextOverrides)
      setProfileMessage(null)
      isHydrating.current = false
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [scope])

  useEffect(() => {
    if (isHydrating.current) return
    const storageKeys = getProfileStorageKeys(scope)
    writeStoredJson(storageKeys.interests[0], activeInterests)
  }, [activeInterests, scope])

  useEffect(() => {
    if (isHydrating.current) return
    const storageKeys = getProfileStorageKeys(scope)
    writeStoredJson(storageKeys.overrides[0], overrides)
  }, [overrides, scope])

  function toggleStarterInterest(interest: InterestDefinition) {
    const isActive = activeInterests.some((item) => item.id === interest.id)

    setActiveInterests((current) =>
      isActive ? current.filter((item) => item.id !== interest.id) : [...current, interest],
    )
    setOverrides({})
    setProfileMessage(null)
  }

  function addCustomInterest(label: string) {
    const created = createCustomInterest(label)
    if (!created) {
      setProfileMessage('Enter an interest label before adding it.')
      return false
    }

    if (activeInterests.some((interest) => interest.label.toLowerCase() === created.label.toLowerCase())) {
      setProfileMessage(`"${created.label}" is already part of your profile.`)
      return false
    }

    setActiveInterests((current) => [...current, created])
    setOverrides({})
    setProfileMessage(`Added "${created.label}" to your interest profile.`)
    return true
  }

  function setOverride(bookmarkId: string, interestId: string) {
    setOverrides((current) => ({
      ...current,
      [bookmarkId]: interestId,
    }))
  }

  function clearOverride(bookmarkId: string) {
    setOverrides((current) => {
      const next = { ...current }
      delete next[bookmarkId]
      return next
    })
  }

  return {
    activeInterests,
    overrides,
    profileMessage,
    addCustomInterest,
    clearOverride,
    setOverride,
    toggleStarterInterest,
  }
}
