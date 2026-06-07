import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Start from './pages/Start'
import Sync from './pages/Sync'
import './index.css'

function AppRouter() {
  return (
    <BrowserRouter basename="/timer">
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
