const BASE = 'https://test.lila.com.ar/api/timer-api/timer'

function unwrap(json) {
  return json && json.data !== undefined ? json.data : json
}

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...rest,
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const json = await res.json()
  return unwrap(json)
}

export const timerApi = {
  /** GET / — returns last created timer */
  getLast: () => request('/'),

  /** POST / — create timer: { title, seconds } */
  create: ({ title, seconds }) =>
    request('/', { method: 'POST', body: JSON.stringify({ title, seconds }) }),

  /** DELETE /{id} — hard delete; must send X-From-View: start */
  deleteById: (id) =>
    request(`/${id}`, { method: 'DELETE', headers: { 'X-From-View': 'start' } }),

  /** POST /{id}/pause */
  pause: (id) => request(`/${id}/pause`, { method: 'POST' }),

  /** POST /{id}/resume */
  resume: (id) => request(`/${id}/resume`, { method: 'POST' }),

  /** GET /{id}/sync — returns { remainingSeconds, paused } */
  sync: (id) => request(`/${id}/sync`),
}
