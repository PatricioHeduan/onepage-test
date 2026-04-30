// Simple frontend storage for the timer record using localStorage.
// Exports async functions to keep API similar to a real DB.

const KEY = 'app.timer.record'

export async function saveTimer(record) {
  // record: { minutes, seconds, expireAt }
  localStorage.setItem(KEY, JSON.stringify(record))
  return record
}

export async function getTimer() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse timer record', e)
    return null
  }
}

export async function clearTimer() {
  localStorage.removeItem(KEY)
}
