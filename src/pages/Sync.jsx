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
    }, 500)
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
      if (data && data.expireAt && data.expireAt > Date.now()) {
        // we have a valid future expireAt -> show timer and stop polling
        const msLeft = data.expireAt - Date.now()
        setRemaining(Math.max(0, Math.ceil(msLeft / 1000)))
        stopPolling()
      } else {
        // no valid timer yet: clear remaining and start polling
        setRemaining(null)
        startPolling()
      }
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
    // initial refresh (do not start polling until refresh decides)
    refresh()
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
      // when timer is active, stop polling so the UI can run locally
      stopPolling()
    }
    return () => clearInterval(intervalRef.current)
  }, [remaining])

  function formatTime(s) {
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

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
        {remaining != null ? (
          <div style={{fontSize:300,fontWeight:700}}>{formatTime(remaining)}</div>
        ) : (
          <div style={{fontSize:28,color:'#888'}}>No timer found</div>
        )}
      </div>
    </div>
  )
}
