import React, { useState } from 'react'
import { fetchTimerNetwork } from '../lib/api'
import { clearTimer } from '../lib/storage'

export default function Sync() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchTimer = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchTimerNetwork()
      setData(res.data)
      if (res.source === 'local' && res.error) {
        setError('Network error: ' + res.error + ' (using local cache)')
      }
    } catch (err) {
      setError(err.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  const clearStored = async () => {
    await clearTimer()
    setData(null)
  }

  return (
    <div className="page">
      <h1>Sync - Timer from frontend storage</h1>
      <p>Reads the timer record saved by /start (localStorage).</p>
      <div className="actions">
        <button onClick={fetchTimer} disabled={loading}>{loading ? 'Loading...' : 'Load timer'}</button>
        <button onClick={clearStored}>Clear</button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      {data ? (
        <pre className="result">{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <div className="result">No timer record found.</div>
      )}
    </div>
  )
}
