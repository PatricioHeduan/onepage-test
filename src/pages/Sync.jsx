import React, { useEffect, useRef, useState } from 'react'
import { fetchTimerNetwork } from '../lib/api'

export default function Sync() {
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const intervalRef = useRef(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetchTimerNetwork()
      const data = res.data
      if (data && data.expireAt) {
        const msLeft = data.expireAt - Date.now()
        setRemaining(Math.max(0, Math.ceil(msLeft / 1000)))
      } else {
        setRemaining(null)
      }
    } catch (e) {
      setRemaining(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial refresh
    refresh()
    return () => clearInterval(intervalRef.current)
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

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{padding:32,textAlign:'center'}}>
        <button
          onClick={refresh}
          style={{fontSize:20,padding:'14px 28px',borderRadius:10,display:'inline-flex',alignItems:'center',gap:10}}
          disabled={loading}
        >
          {loading ? (
            'Loading...'
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 12a9 9 0 10-2.6 6.01" stroke="#04293a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3v6h-6" stroke="#04293a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {remaining != null ? (
          <div style={{fontSize:'min(60vw,360px)',fontWeight:800,lineHeight:1}}>{formatTime(remaining)}</div>
        ) : (
          <div style={{fontSize:36,color:'#888'}}>No timer found</div>
        )}
      </div>
    </div>
  )
}
