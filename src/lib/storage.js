// Simple frontend storage for the timer record using localStorage.
// We store `seconds` and `startedAt` (ms since epoch).

const KEY = 'app.timer.record'

export async function saveTimer(record) {
  // record: { seconds, startedAt, id? }
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
