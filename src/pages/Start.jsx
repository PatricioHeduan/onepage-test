import React, { useEffect, useRef, useState } from 'react'
import { postTimerNetwork } from '../lib/api'

function pad(n) {
  return n.toString().padStart(2, '0')
}

export default function Start() {
  const [minutes, setMinutes] = useState(3)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(3 * 60)
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
    setRemaining(minutes * 60 + seconds)
    setRunning(true)
    // Try to post to server; lib will fallback to localStorage if needed
    postTimerNetwork({ minutes, seconds }).then(res => {
      if (res.source === 'server') {
        // use server expireAt if provided
        // no-op here; UI will keep counting
      } else {
        console.log('Saved locally (server unavailable):', res.error)
      }
    })
  }

  const stop = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
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
