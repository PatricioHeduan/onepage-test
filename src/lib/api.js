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

export async function postTimerNetwork({ minutes, seconds }) {
  const body = { minutes, seconds, clientId: getClientId() }
  try {
    const res = await fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // persist locally as cache/fallback
    try { await saveTimer({ minutes, seconds, expireAt: json.expireAt, ...json }) } catch (e) {}
    return { source: 'server', data: json }
  } catch (err) {
    // fallback to local save
    const expireAt = Date.now() + (minutes * 60 + seconds) * 1000
    const record = { minutes, seconds, expireAt, createdBy: getClientId() }
    await saveTimer(record)
    return { source: 'local', data: record, error: err.message }
  }
}

export async function fetchTimerNetwork() {
  try {
    const res = await fetch('/api/timer')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    // If server returns found=false, map to null
    if (json && json.found === false) return { source: 'server', data: null }
    // save as cache
    try {
      if (json && json.expireAt) await saveTimer({ minutes: json.minutes ?? 0, seconds: json.seconds ?? 0, expireAt: json.expireAt, ...json })
    } catch (e) {}
    return { source: 'server', data: json }
  } catch (err) {
    // fallback to local stored timer
    const local = await getTimer()
    return { source: 'local', data: local, error: err.message }
  }
}
