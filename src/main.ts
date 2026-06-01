// setImmediate polyfill — required by @php-wasm
if (!('setImmediate' in globalThis)) {
  ;(globalThis as any).setImmediate = (fn: (...args: any[]) => void) => setTimeout(fn, 0)
}

// WASM chunk fetch interceptor — reassembles split .wasm files listed in wasm-chunks.json.
// The manifest is written by scripts/split-wasm.js at build time and lists only the .wasm
// files that exceeded Cloudflare Pages' per-file limit and had to be chunked.
// Must run before any WASM fetch (i.e. before PHP boot).
const _origFetch = globalThis.fetch
let _chunkManifest: Promise<Record<string, string[]>> | null = null

function loadChunkManifest(baseUrl: string): Promise<Record<string, string[]>> {
  if (!_chunkManifest) {
    _chunkManifest = _origFetch(baseUrl + 'wasm-chunks.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
  }
  return _chunkManifest
}

globalThis.fetch = async function (url: RequestInfo | URL, opts?: RequestInit) {
  const urlStr = String(url)
  if (!urlStr.endsWith('.wasm')) return _origFetch(url, opts)

  const lastSlash = urlStr.lastIndexOf('/')
  const baseUrl = urlStr.substring(0, lastSlash + 1)
  const fileName = urlStr.substring(lastSlash + 1)

  const manifest = await loadChunkManifest(baseUrl)
  const chunks = manifest[fileName]
  if (!chunks) return _origFetch(url, opts)

  const parts: ArrayBuffer[] = await Promise.all(
    chunks.map((c: string) => _origFetch(baseUrl + c).then((r: Response) => r.arrayBuffer()))
  )
  const total = parts.reduce((sum, p) => sum + p.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    merged.set(new Uint8Array(part), offset)
    offset += part.byteLength
  }
  return new Response(merged, {
    status: 200,
    headers: { 'Content-Type': 'application/wasm' },
  })
} as typeof fetch

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
