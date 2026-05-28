import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import Start from './pages/Start'
import Create from './pages/Create'
import Sync from './pages/Sync'
import './index.css'

function AppRouter() {
  return (
    <BrowserRouter basename="/timer">
      <TimerProvider>
        <div className="nav">
          <Link to="/start">Start</Link>
          <Link to="/create">Create</Link>
          <Link to="/sync">Sync</Link>
        </div>
        <Routes>
          <Route path="/start" element={<Start />} />
          <Route path="/create" element={<Create />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/" element={<Start />} />
        </Routes>
      </TimerProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
