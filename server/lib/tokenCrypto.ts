import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const AES_ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12

function decodeKey(keyMaterial: string) {
  const key = Buffer.from(keyMaterial, 'base64')

  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.')
  }

  return key
}

export function encryptToken(plaintext: string, keyMaterial: string) {
  const key = decodeKey(keyMaterial)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(AES_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decryptToken(ciphertext: string, keyMaterial: string) {
  const [ivEncoded, authTagEncoded, payloadEncoded] = ciphertext.split('.')

  if (!ivEncoded || !authTagEncoded || !payloadEncoded) {
    throw new Error('Encrypted token payload is malformed.')
  }

  const key = decodeKey(keyMaterial)
  const decipher = createDecipheriv(AES_ALGORITHM, key, Buffer.from(ivEncoded, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagEncoded, 'base64'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadEncoded, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
