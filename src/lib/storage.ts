const fallbackStorageKeys = {
  interests: ['x-bookie/interests/v1', 'signal-shelf/interests/v1'],
  overrides: ['x-bookie/overrides/v1', 'signal-shelf/overrides/v1'],
}

export function getProfileStorageKeys(scope: string) {
  return {
    interests: [`x-bookie/${scope}/interests/v2`, ...fallbackStorageKeys.interests],
    overrides: [`x-bookie/${scope}/overrides/v2`, ...fallbackStorageKeys.overrides],
  }
}

export function readStoredJson<T>(keys: string | string[], fallback: T) {
  const orderedKeys = Array.isArray(keys) ? keys : [keys]

  for (const key of orderedKeys) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      return JSON.parse(rawValue) as T
    } catch {
      continue
    }
  }

  return fallback
}

export function writeStoredJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}
