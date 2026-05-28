import React, { createContext, useContext, useState } from 'react'

const TimerContext = createContext(null)

export function TimerProvider({ children }) {
  const [timer, setTimer] = useState(null)          // { id, title, seconds, ... }
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const [paused, setPaused] = useState(false)

  return (
    <TimerContext.Provider value={{ timer, setTimer, remainingSeconds, setRemainingSeconds, paused, setPaused }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  return useContext(TimerContext)
}
