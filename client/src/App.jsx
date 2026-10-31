import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    let active = true

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`)
        }

        return response.json()
      })
      .then((data) => {
        if (active) {
          setApiStatus(data.message)
        }
      })
      .catch(() => {
        if (active) {
          setApiStatus('Unable to connect to the API')
        }
      })

    return () => {
      active = false
    }
  }, [])

  const isConnected = apiStatus === 'StudyPot API is running'

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="StudyPot home">
          <span className="wordmark-icon" aria-hidden="true">s</span>
          <span>studypot</span>
        </a>
        <span className="header-note">Find your focus, together.</span>
      </header>

      <section className="welcome-card" aria-labelledby="welcome-heading">
        <div className="welcome-copy">
          <p className="eyebrow">A little more focus, a lot more together</p>
          <h1 id="welcome-heading">Make room for<br />a better study sesh.</h1>
          <p className="welcome-description">
            Find your people, share a study table, and make progress together.
            Your next great study session starts here.
          </p>
          <div
            className={`api-status ${isConnected ? 'is-connected' : ''}`}
            role="status"
          >
            <span className="status-dot" aria-hidden="true" />
            {apiStatus === 'checking' ? 'Connecting to the StudyPot API…' : apiStatus}
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-card">
            <span className="art-book">✳</span>
            <span className="art-line art-line-long" />
            <span className="art-line art-line-short" />
            <span className="art-check">✓</span>
          </div>
          <span className="art-sparkle sparkle-one">✦</span>
          <span className="art-sparkle sparkle-two">✳</span>
        </div>
      </section>

      <footer className="site-footer">
        <span>Good things grow when we learn together.</span>
        <span className="footer-decoration" aria-hidden="true">✳ &nbsp; ✦ &nbsp; ✳</span>
      </footer>
    </main>
  )
}

export default App
