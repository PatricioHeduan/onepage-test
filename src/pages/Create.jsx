import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { timerApi } from '../lib/timerApi'
import { useTimer } from '../context/TimerContext'

export default function Create() {
  const [title, setTitle] = useState('')
  const [seconds, setSeconds] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { setTimer, setRemainingSeconds, setPaused } = useTimer()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || Number(seconds) < 1) return
    setLoading(true)
    setError(null)
    try {
      const data = await timerApi.create({ title: title.trim(), seconds: Number(seconds) })
      setTimer(data)
      setRemainingSeconds(Number(seconds))
      setPaused(false)
      navigate('/start')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>New Timer</h1>
      <form onSubmit={handleSubmit}>
        <div className="controls">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Pomodoro"
              required
            />
          </label>
          <label>
            Duration (seconds)
            <input
              type="number"
              min="1"
              value={seconds}
              onChange={e => setSeconds(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/start')} style={{ background: 'transparent', color: 'var(--accent)' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
