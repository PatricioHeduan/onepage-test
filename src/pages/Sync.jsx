import React, { useEffect, useRef, useState } from 'react'
import { fetchTimerNetwork } from '../lib/api'

export default function Sync() {
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(null)
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
        } catch (e) {}
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
        setRemaining(Math.max(0, Math.ceil(msLeft / 1000)))
      } else {
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
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  const displaySeconds = remaining != null ? remaining : 0

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{padding:24,textAlign:'center'}}>
        <button onClick={refresh} style={{fontSize:18,padding:'10px 18px',borderRadius:8,display:'inline-flex',alignItems:'center',gap:8}} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M21 12a9 9 0 1 0-2.53 6.06" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loading ? 'Loading...' : 'Re-analizar'}
        </button>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:96,fontWeight:700,lineHeight:1}}>{formatTime(displaySeconds)}</div>
      </div>
    </div>
  )
}
