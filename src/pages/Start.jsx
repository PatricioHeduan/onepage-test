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
  const totalRef = useRef(3 * 60)
  const minutesInputRef = useRef(null)
  const secondsInputRef = useRef(null)

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
    totalRef.current = totalSeconds
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

  function formatTime(s) {
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  function timerColor() {
    if (!running) return '#e6eef8'
    const total = totalRef.current || (minutes * 60 + seconds) || 1
    const ratio = remaining / total
    if (ratio > 2 / 3) return '#22c55e'     // vibrant green
    if (ratio > 1 / 3) return '#eab308'     // vibrant yellow
    return '#ef4444'                         // vibrant red
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: timerColor(),
      transition: 'background 0.8s',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {running ? (
        <div style={{
          fontSize: '33vw',
          fontWeight: 700,
          lineHeight: 1,
          color: '#000',
        }}>
          {formatTime(remaining)}
        </div>
      ) : (
        <div style={{
          fontSize: '33vw',
          fontWeight: 700,
          lineHeight: 1,
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
        }}>
          <input
            ref={minutesInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pad(minutes)}
            onChange={e => {
              const val = Number(e.target.value.replace(/\D/g, ''))
              setMinutes(val)
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') {
                const len = e.target.value.length
                if (e.target.selectionStart === len && e.target.selectionEnd === len) {
                  e.preventDefault()
                  secondsInputRef.current?.focus()
                  // Focus the start of the seconds field
                  secondsInputRef.current?.setSelectionRange(0, 0)
                }
              }
            }}
            style={{
              width: '2ch',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              color: 'inherit',
              textAlign: 'right',
              padding: 0,
              margin: 0,
              fontFamily: 'inherit',
            }}
          />
          <span style={{ display: 'inline-block', position: 'relative', top: '-1.5vw' }}>:</span>
          <input
            ref={secondsInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pad(seconds)}
            onChange={e => {
              const val = Number(e.target.value.replace(/\D/g, ''))
              setSeconds(Math.min(59, val))
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowLeft') {
                if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
                  e.preventDefault()
                  minutesInputRef.current?.focus()
                  // Focus the end of the minutes field
                  const len = minutesInputRef.current?.value.length || 0
                  minutesInputRef.current?.setSelectionRange(len, len)
                }
              }
            }}
            style={{
              width: '2ch',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              color: 'inherit',
              textAlign: 'left',
              padding: 0,
              margin: 0,
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '24px',
        marginTop: '20px',
        zIndex: 10
      }}>
        <button
          onClick={start}
          disabled={running}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: 'none',
            background: running ? 'rgba(0,0,0,0.1)' : '#ffffff',
            color: '#000000',
            cursor: running ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'transform 0.2s, background-color 0.2s',
            opacity: running ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!running) e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { if (!running) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button
          onClick={stop}
          disabled={!running}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: 'none',
            background: !running ? 'rgba(0,0,0,0.1)' : '#ffffff',
            color: '#000000',
            cursor: !running ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'transform 0.2s, background-color 0.2s',
            opacity: !running ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (running) e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { if (running) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
