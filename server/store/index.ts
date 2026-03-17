import { createMemoryStore } from './memoryStore.js'
import { createPostgresStore } from './postgresStore.js'
import type { AppStore } from './types.js'
import { serverConfig } from '../config.js'

export async function createStore(): Promise<AppStore> {
  if (serverConfig.DATABASE_URL) {
    return createPostgresStore()
  }

  return createMemoryStore()
}
