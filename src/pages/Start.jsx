import React, { useEffect, useRef, useState } from 'react'
import { timerApi } from '../lib/timerApi'
import { useTimer } from '../context/TimerContext'

function pad(n) { return String(Math.max(0, n)).padStart(2, '0') }
function formatTime(s) {
  if (s == null || s < 0) s = 0
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export default function Start() {
  const { timer, setTimer, remainingSeconds, setRemainingSeconds, paused, setPaused } = useTimer()
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [loadingPauseResume, setLoadingPauseResume] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  // ── create form state ─────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createSeconds, setCreateSeconds] = useState(60)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [createError, setCreateError] = useState(null)

  const countdownRef = useRef(null)
  const pollRef = useRef(null)

  // ── local countdown tick ──────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(countdownRef.current)
    if (!paused && remainingSeconds != null && remainingSeconds > 0) {
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(r => (r > 0 ? r - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, timer?.id])

  // ── re-seed from sync if drift > 2s; update paused state ─────────────────
  const syncFromServer = async (id) => {
    try {
      const data = await timerApi.sync(id)
      const serverRemaining = data.remainingSeconds ?? data.remaining_seconds ?? 0
      const serverPaused = data.paused ?? false
      setPaused(serverPaused)
      setRemainingSeconds(prev => {
        if (prev == null || Math.abs(prev - serverRemaining) > 2) return serverRemaining
        return prev
      })
    } catch (_) { /* keep local countdown on error */ }
  }

  // ── mount: fetch last timer, seed from sync, start 5s poll ───────────────
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setInitialLoading(true)
      setLoadError(null)
      try {
        const data = await timerApi.getLast()
        if (cancelled) return
        if (data && data.id) {
          setTimer(data)
          const syncData = await timerApi.sync(data.id)
          if (cancelled) return
          setPaused(syncData.paused ?? false)
          setRemainingSeconds(syncData.remainingSeconds ?? syncData.remaining_seconds ?? 0)
          pollRef.current = setInterval(() => syncFromServer(data.id), 5000)
        } else {
          setTimer(null)
          setRemainingSeconds(null)
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message)
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      clearInterval(pollRef.current)
      clearInterval(countdownRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── pause / resume ────────────────────────────────────────────────────────
  const handlePauseResume = async () => {
    if (!timer) return
    setLoadingPauseResume(true)
    setActionError(null)
    try {
      if (paused) {
        await timerApi.resume(timer.id)
        setPaused(false)
      } else {
        await timerApi.pause(timer.id)
        setPaused(true)
      }
    } catch (e) {
      setActionError(e.message)
    } finally {
      setLoadingPauseResume(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!timer) return
    setLoadingDelete(true)
    setActionError(null)
    try {
      await timerApi.deleteById(timer.id)
      clearInterval(pollRef.current)
      clearInterval(countdownRef.current)
      setTimer(null)
      setRemainingSeconds(null)
      setPaused(false)
    } catch (e) {
      setActionError(e.message)
    } finally {
      setLoadingDelete(false)
    }
  }

  // ── create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createTitle.trim() || Number(createSeconds) < 1) return
    setLoadingCreate(true)
    setCreateError(null)
    try {
      const data = await timerApi.create({ title: createTitle.trim(), seconds: Number(createSeconds) })
      setTimer(data)
      setRemainingSeconds(Number(createSeconds))
      setPaused(false)
      setShowCreate(false)
      setCreateTitle('')
      setCreateSeconds(60)
    } catch (e) {
      setCreateError(e.message)
    } finally {
      setLoadingCreate(false)
    }
  }

  if (initialLoading) return <div className="page"><p>Loading...</p></div>
  if (loadError) return <div className="page"><p className="error">Error: {loadError}</p></div>

  // ── inline create form ────────────────────────────────────────────────────
  if (!timer || showCreate) return (
    <div className="page">
      <h1>{timer ? 'New Timer' : 'No active timer'}</h1>
      <form onSubmit={handleCreate}>
        <div className="controls">
          <label>
            Title
            <input
              type="text"
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              placeholder="e.g. Pomodoro"
              required
            />
          </label>
          <label>
            Duration (seconds)
            <input
              type="number"
              min="1"
              value={createSeconds}
              onChange={e => setCreateSeconds(e.target.value)}
              required
            />
          </label>
        </div>
        {createError && <p className="error">{createError}</p>}
        <div className="actions">
          <button type="submit" disabled={loadingCreate}>
            {loadingCreate ? 'Creating...' : 'Create'}
          </button>
          {timer && (
            <button type="button" onClick={() => setShowCreate(false)}
              style={{ background: 'transparent', color: 'var(--accent)' }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )

  // ── active timer view ─────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1>Timer</h1>
      <h2 style={{ marginBottom: 8 }}>{timer.title}</h2>
      <div className="timer">
        <span className="time">{formatTime(remainingSeconds)}</span>
      </div>
      {paused && <p style={{ textAlign: 'center', opacity: 0.6 }}>⏸ Paused</p>}
      {actionError && <p className="error">{actionError}</p>}
      <div className="actions">
        <button onClick={handlePauseResume} disabled={loadingPauseResume}>
          {loadingPauseResume ? '...' : paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={handleDelete}
          disabled={loadingDelete}
          style={{ background: '#f87171', borderColor: '#f87171' }}
        >
          {loadingDelete ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={() => setShowCreate(true)}
          style={{ background: 'transparent', color: 'var(--accent)' }}>
          + New timer
        </button>
      </div>
    </div>
  )
}
