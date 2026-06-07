import React, { useEffect, useRef, useState } from 'react'
import { fetchTimerNetwork } from '../lib/api'

export default function Sync() {
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const totalRef = useRef(null)   // total seconds of the active timer
  const intervalRef = useRef(null)
  const pollRef = useRef(null)
  const isFetchingRef = useRef(false)

  const startPolling = () => {
    if (pollRef.current) return
    pollRef.current = setInterval(() => {
      if (!isFetchingRef.current) refresh({ fromPoll: true })
    }, 200)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const refresh = async ({ fromPoll = false } = {}) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    if (!fromPoll) setLoading(true)
    try {
      const res = await fetchTimerNetwork()
      const data = res.data
      // if server returned a timer object with id, adopt it if different
      if (data && data.id) {
        try {
          const stored = localStorage.getItem('sync.timer.id')
          if (String(stored) !== String(data.id)) {
            localStorage.setItem('sync.timer.id', String(data.id))
          }
        } catch (e) { }
      }
      // compute end time from startedAt + seconds, or fallback to expireAt
      function parseIsoToMs(iso) {
        if (iso == null) return null
        if (typeof iso === 'number') return iso
        if (typeof iso !== 'string') return null
        const fixed = iso.replace(/(\.\d{3})\d+/, '$1')
        const t = Date.parse(fixed)
        if (!isNaN(t)) return t
        const d = new Date(fixed)
        if (!isNaN(d.getTime())) return d.getTime()
        return null
      }

      let endMs = null
      if (data) {
        if (data.startedAt && data.seconds) {
          const startMs = typeof data.startedAt === 'number' ? data.startedAt : parseIsoToMs(data.startedAt)
          if (startMs != null) endMs = Number(startMs) + Number(data.seconds) * 1000
        } else if (data.expireAt) {
          endMs = typeof data.expireAt === 'number' ? data.expireAt : parseIsoToMs(data.expireAt)
        }
      }
      if (endMs && endMs > Date.now()) {
        const msLeft = endMs - Date.now()
        const secs = Math.max(0, Math.ceil(msLeft / 1000))
        if (data && data.seconds) totalRef.current = Number(data.seconds)
        setRemaining(secs)
      } else {
        totalRef.current = null
        setRemaining(null)
      }
      // ensure polling is running so new timers are detected
      startPolling()
    } catch (e) {
      setRemaining(null)
      // on network error, keep polling active so it can recover
      startPolling()
    } finally {
      isFetchingRef.current = false
      if (!fromPoll) setLoading(false)
    }
  }

  useEffect(() => {
    // initial refresh and start polling always
    refresh()
    startPolling()
    return () => {
      clearInterval(intervalRef.current)
      stopPolling()
    }
  }, [])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (remaining != null) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => (r > 0 ? r - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [remaining])

  function formatTime(s) {
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const displaySeconds = remaining != null ? remaining : 0

  function timerColor() {
    if (!totalRef.current || remaining == null) return '#e6eef8'
    const ratio = remaining / totalRef.current  // 1 = just started, 0 = finished
    if (ratio > 2 / 3) return '#22c55e'   // vibrant green  — first third
    if (ratio > 1 / 3) return '#eab308'   // vibrant yellow — second third
    return '#ef4444'                       // vibrant red    — last third
  }
  ss
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: timerColor(),
      transition: 'background 0.8s',
    }}>
      <div style={{
        fontSize: '33vw',
        fontWeight: 700,
        lineHeight: 1,
        color: '#000',
      }}>{formatTime(displaySeconds)}</div>
    </div>
  )
}
