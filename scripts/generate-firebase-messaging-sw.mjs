import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = path.join(rootDir, 'public', 'firebase-messaging-sw.js')
const outputPath = path.join(rootDir, 'dist', 'firebase-messaging-sw.js')

const config = {
  FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([name]) => `VITE_${name}`)

if (missing.length > 0) {
  throw new Error(`Missing Firebase configuration for service worker: ${missing.join(', ')}`)
}

let serviceWorker = await fs.readFile(templatePath, 'utf8')

for (const [placeholder, value] of Object.entries(config)) {
  serviceWorker = serviceWorker.replaceAll(`__${placeholder}__`, JSON.stringify(value))
}

if (/__[A-Z0-9_]+__/.test(serviceWorker)) {
  throw new Error('Unresolved Firebase service-worker configuration placeholder')
}

await fs.writeFile(outputPath, serviceWorker)
