import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import HabitForm from './pages/HabitForm'
import HabitDetail from './pages/HabitDetail'
import Analytics from './pages/Analytics'
import './styles.css'

function App(){
  return (
    <BrowserRouter>
      <div className="container">
        <header>
          <h1>Smart Habit Tracker</h1>
          <nav>
            <Link to="/">Home</Link> | <Link to="/add">Add</Link> | <Link to="/analytics">Analytics</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<HabitForm />} />
            <Route path="/habit/:id" element={<HabitDetail />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
