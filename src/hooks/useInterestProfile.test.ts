/* @vitest-environment jsdom */

import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'

import { starterInterests } from '../lib/bookmarks'
import { useInterestProfile } from './useInterestProfile'

describe('useInterestProfile', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('hydrates from scoped storage keys', async () => {
    const scopedInterestsKey = 'x-bookie/u1/interests/v2'
    const scopedOverridesKey = 'x-bookie/u1/overrides/v2'
    const scopedInterests = [starterInterests[0], starterInterests[1]]
    const scopedOverrides = { a: 'interest-a' }

    window.localStorage.setItem(scopedInterestsKey, JSON.stringify(scopedInterests))
    window.localStorage.setItem(scopedOverridesKey, JSON.stringify(scopedOverrides))

    const { result } = renderHook(() => useInterestProfile('u1'))

    await waitFor(() => {
      expect(result.current.activeInterests).toEqual(scopedInterests)
    })
    expect(result.current.overrides).toEqual(scopedOverrides)
  })

  test('reads fallback keys when scoped keys are absent', async () => {
    window.localStorage.setItem('x-bookie/interests/v1', JSON.stringify([starterInterests[0]]))
    window.localStorage.setItem('x-bookie/overrides/v1', JSON.stringify({ old: 'legacy-interest' }))

    const { result } = renderHook(() => useInterestProfile('missing-scope'))

    await waitFor(() => {
      expect(result.current.activeInterests).toEqual([starterInterests[0]])
    })
    expect(result.current.overrides).toEqual({ old: 'legacy-interest' })
  })

  test('toggleStarterInterest updates interests and clears overrides', async () => {
    window.localStorage.setItem('x-bookie/u2/overrides/v2', JSON.stringify({ b1: 'something' }))

    const { result } = renderHook(() => useInterestProfile('u2'))

    await waitFor(() => {
      expect(result.current.overrides).toEqual({ b1: 'something' })
    })

    act(() => {
      result.current.toggleStarterInterest(starterInterests[0])
    })

    await waitFor(() => {
      expect(result.current.overrides).toEqual({})
    })
    expect(window.localStorage.getItem('x-bookie/u2/overrides/v2')).toBe('{}')
  })

  test('addCustomInterest enforces blank and duplicate labels', async () => {
    const { result } = renderHook(() => useInterestProfile('u3'))

    let added = false
    act(() => {
      added = result.current.addCustomInterest('   ')
    })
    expect(added).toBe(false)
    expect(result.current.profileMessage).toBe('Enter an interest label before adding it.')

    act(() => {
      added = result.current.addCustomInterest(starterInterests[0].label.toUpperCase())
    })
    expect(added).toBe(false)
    expect(result.current.profileMessage).toContain('already part of your profile')
  })

  test('addCustomInterest success appends interest and clears overrides', async () => {
    window.localStorage.setItem('x-bookie/u4/overrides/v2', JSON.stringify({ b1: 'old' }))
    const { result } = renderHook(() => useInterestProfile('u4'))

    await waitFor(() => {
      expect(result.current.overrides).toEqual({ b1: 'old' })
    })

    let added = false
    act(() => {
      added = result.current.addCustomInterest('Deep Work')
    })

    expect(added).toBe(true)
    expect(result.current.profileMessage).toContain('Added "Deep Work"')
    expect(result.current.activeInterests.some((interest) => interest.label === 'Deep Work')).toBe(true)
    expect(result.current.overrides).toEqual({})
    expect(window.localStorage.getItem('x-bookie/u4/overrides/v2')).toBe('{}')
  })

  test('scope change rehydrates account-specific state', async () => {
    window.localStorage.setItem('x-bookie/a/interests/v2', JSON.stringify([starterInterests[0]]))
    window.localStorage.setItem('x-bookie/b/interests/v2', JSON.stringify([starterInterests[2]]))

    const { result, rerender } = renderHook(({ scope }: { scope: string }) => useInterestProfile(scope), {
      initialProps: { scope: 'a' },
    })
    await waitFor(() => {
      expect(result.current.activeInterests).toEqual([starterInterests[0]])
    })

    rerender({ scope: 'b' })

    await waitFor(() => {
      expect(result.current.activeInterests).toEqual([starterInterests[2]])
    })
  })
})
