import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import SessionDetails from './pages/SessionDetails.jsx'
import './App.css'

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="StudyPot home">
          <span className="wordmark-icon" aria-hidden="true">s</span>
          <span>studypot</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/">Discover</Link>
          <span className="student-label">Alex Morgan</span>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions/:id" element={<SessionDetails />} />
        <Route path="*" element={<section className="empty-panel"><h1>Page not found</h1><Link className="text-link" to="/">Back to sessions</Link></section>} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
