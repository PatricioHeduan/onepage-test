import React, { useState, useEffect, useRef } from 'react'
import { fetchTimerNetwork } from '../lib/api'
import { clearTimer } from '../lib/storage'

export default function Sync() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const tickRef = useRef(null)

  const fetchTimer = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchTimerNetwork()
      setData(res.data)
      // if we have an expireAt, compute remaining and start interval
      if (res.data && res.data.expireAt) {
        const ms = typeof res.data.expireAt === 'number' ? res.data.expireAt : Date.parse(res.data.expireAt)
        const update = () => {
          const rem = Math.max(0, Math.ceil((ms - Date.now()) / 1000))
          setRemaining(rem)
        }
        update()
        clearInterval(tickRef.current)
        tickRef.current = setInterval(update, 1000)
      } else {
        clearInterval(tickRef.current)
        setRemaining(null)
      }
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
    clearInterval(tickRef.current)
    setRemaining(null)
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
        <div className="result">
          {remaining != null ? (
            <div>Remaining: {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</div>
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      ) : (
        <div className="result">No timer record found.</div>
      )}
    </div>
  )
}
