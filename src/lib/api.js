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
  // API sends total seconds only; backend may return startedAt in the response.
  const localStartedAt = Date.now()
  const body = { seconds, clientId: getClientId() }
  try {
    const res = await fetch('https://test.lila.com.ar/api/timer-api/timer/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // Support responses that wrap data: { message, data: { seconds, startedAt or expireAt, id, ... } }
    const payload = json && json.data ? json.data : json
    // If server returned expireAt, convert to startedAt using the seconds value
    if (payload && payload.expireAt && payload.seconds) {
      const ms = parseIsoToMs(payload.expireAt)
      if (ms) payload.startedAt = ms - (payload.seconds * 1000)
    }
    // If server returned startedAt as string or number, normalize to number
    if (payload && payload.startedAt) {
      const ms = parseIsoToMs(payload.startedAt)
      if (ms) payload.startedAt = ms
    }
    // persist locally as cache/fallback (we store seconds + startedAt)
    try { await saveTimer({ seconds: payload.seconds ?? seconds, startedAt: payload.startedAt ?? localStartedAt, id: payload.id, ...payload }) } catch (e) {}
    return { source: 'server', data: payload }
  } catch (err) {
    // fallback to local save
    const record = { seconds, startedAt: localStartedAt, createdBy: getClientId() }
    await saveTimer(record)
    return { source: 'local', data: record, error: err.message }
  }
}

export async function fetchTimerNetwork() {
  try {
  const res = await fetch('https://test.lila.com.ar/api/timer-api/timer/')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // Support wrapped responses: { message, data: {...} }
    if (json && json.found === false) return { source: 'server', data: null }
    const payload = json && json.data ? json.data : json
    // If payload has expireAt + seconds, convert to startedAt
    if (payload && payload.expireAt && payload.seconds) {
      const ms = parseIsoToMs(payload.expireAt)
      if (ms) payload.startedAt = ms - (payload.seconds * 1000)
    }
    if (payload && payload.startedAt) {
      const ms = parseIsoToMs(payload.startedAt)
      if (ms) payload.startedAt = ms
    }
    // save as cache
    try {
      if (payload && payload.startedAt) await saveTimer({ seconds: payload.seconds ?? 0, startedAt: payload.startedAt, id: payload.id, ...payload })
    } catch (e) {}
    return { source: 'server', data: payload }
  } catch (err) {
    // fallback to local stored timer
    const local = await getTimer()
    return { source: 'local', data: local, error: err.message }
  }
}

export async function deleteTimerNetwork(id) {
  if (!id) throw new Error('Missing id')
  try {
    const res = await fetch('https://test.lila.com.ar/api/timer-api/timer/' + encodeURIComponent(id), {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    // attempt to parse response but we don't require it
    try { await res.json() } catch (e) {}
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
