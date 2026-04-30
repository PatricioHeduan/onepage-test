import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Start from './pages/Start'
import Sync from './pages/Sync'
import './index.css'

function AppRouter() {
  return (
    <BrowserRouter>
      <div className="nav">
        <Link to="/start">Start</Link>
        <Link to="/sync">Sync</Link>
      </div>
      <Routes>
        <Route path="/start" element={<Start />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="/" element={<Start />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
