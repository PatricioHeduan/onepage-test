import { saveTimer, getTimer } from './storage'

function getClientId() {
  const KEY = 'client.id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8)
    localStorage.setItem(KEY, id)
  }
  return id
}

// Parse ISO 8601 timestamps that may include microseconds (e.g. 2026-04-30T16:32:20.773494-03:00)
// and return milliseconds since epoch. If input is already a number, return it.
function parseIsoToMs(iso) {
  if (iso == null) return null
  if (typeof iso === 'number') return iso
  if (typeof iso !== 'string') return null
  // JS Date supports milliseconds (3 digits). If server returns microseconds (6 digits)
  // truncate to milliseconds by keeping only first 3 fractional digits.
  const fixed = iso.replace(/(\.\d{3})\d+/, '$1')
  const t = Date.parse(fixed)
  if (!isNaN(t)) return t
  // fallback: try Date constructor
  const d = new Date(fixed)
  if (!isNaN(d.getTime())) return d.getTime()
  return null
}

export async function postTimerNetwork({ seconds }) {
  // API sends only total seconds; backend should accept { seconds }
  const body = { seconds, clientId: getClientId() }
  try {
    const res = await fetch('https://test.lila.com.ar/api/timer-api/timer/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // normalize expireAt (server may return ISO with microseconds)
    if (json && json.expireAt) {
      const ms = parseIsoToMs(json.expireAt)
      if (ms) json.expireAt = ms
    }
    // persist locally as cache/fallback
    try { await saveTimer({ seconds, expireAt: json.expireAt, ...json }) } catch (e) {}
    return { source: 'server', data: json }
  } catch (err) {
    // fallback to local save
    const expireAt = Date.now() + seconds * 1000
    const record = { seconds, expireAt, createdBy: getClientId() }
    await saveTimer(record)
    return { source: 'local', data: record, error: err.message }
  }
}

export async function fetchTimerNetwork() {
  try {
  const res = await fetch('https://test.lila.com.ar/api/timer-api/timer/')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // normalize expireAt coming from server response
    if (json && json.data && json.data.expireAt) {
      const ms = parseIsoToMs(json.data.expireAt)
      if (ms) json.data.expireAt = ms
      // also copy top-level expireAt for compatibility with older responses
      json.expireAt = json.data.expireAt
    }
    // If server returns found=false, map to null
    if (json && json.found === false) return { source: 'server', data: null }
    // save as cache
    try {
      if (json && json.expireAt) await saveTimer({ seconds: json.seconds ?? 0, expireAt: json.expireAt, ...json })
    } catch (e) {}
    return { source: 'server', data: json }
  } catch (err) {
    // fallback to local stored timer
    const local = await getTimer()
    return { source: 'local', data: local, error: err.message }
  }
}
