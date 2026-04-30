import React, { useEffect, useRef, useState } from 'react'
import { postTimerNetwork, deleteTimerNetwork } from '../lib/api'

function pad(n) {
  return n.toString().padStart(2, '0')
}

export default function Start() {
  const [minutes, setMinutes] = useState(3)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(3 * 60)
  const [timerId, setTimerId] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(minutes * 60 + seconds)
  }, [minutes, seconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = () => {
    const totalSeconds = minutes * 60 + seconds
    const pendingStartedAt = Date.now()
    // Save pending timer immediately with start timestamp and duration
    try { localStorage.setItem('sync.timer.pending', JSON.stringify({ startedAt: pendingStartedAt, seconds: totalSeconds })) } catch (e) {}

    // POST to server (api will include startedAt). Only start countdown when response arrives.
    postTimerNetwork({ seconds: totalSeconds }).then(res => {
      const payload = res.data || {}
      // Determine authoritative startedAt and seconds
      const finalStartedAt = payload.startedAt ?? pendingStartedAt
      const finalSeconds = payload.seconds ?? totalSeconds

      // compute remaining from startedAt + seconds
      const endMs = finalStartedAt + finalSeconds * 1000
      const secsLeft = Math.max(0, Math.ceil((endMs - Date.now()) / 1000))
      setRemaining(secsLeft)
      setRunning(true)

      // persist final confirmed record and id
      try { localStorage.setItem('sync.timer.record', JSON.stringify({ startedAt: finalStartedAt, seconds: finalSeconds, id: payload.id })) } catch (e) {}
      if (payload.id) {
        setTimerId(payload.id)
        try { localStorage.setItem('sync.timer.id', String(payload.id)) } catch (e) {}
      }

      // remove pending once started
      try { localStorage.removeItem('sync.timer.pending') } catch (e) {}
      if (res.source !== 'server') console.log('Saved locally (server unavailable):', res.error)
    })
  }

  const stop = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
    // remove any pending record
    try { localStorage.removeItem('sync.timer.pending') } catch (e) {}
    // perform hard delete if we have an id from server
    const storedId = timerId || localStorage.getItem('sync.timer.id')
    if (storedId) {
      deleteTimerNetwork(storedId).then(res => {
        if (!res.ok) console.warn('Failed to delete timer:', res.error)
        setTimerId(null)
        try { localStorage.removeItem('sync.timer.id') } catch (e) {}
      })
    }
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="page">
      <h1>Iniciar cronometro</h1>
      <div className="controls">
        <label>
          Minutes
          <input type="number" min="0" value={minutes} onChange={e => setMinutes(Number(e.target.value))} />
        </label>
        <label>
          Seconds
          <input type="number" min="0" max="59" value={seconds} onChange={e => setSeconds(Number(e.target.value))} />
        </label>
      </div>

      <div className="timer">
        <span className="time">{pad(mins)}:{pad(secs)}</span>
      </div>

      <div className="actions">
        <button onClick={start} disabled={running}>Start</button>
        <button onClick={stop} disabled={!running}>Stop</button>
      </div>
    </div>
  )
}
