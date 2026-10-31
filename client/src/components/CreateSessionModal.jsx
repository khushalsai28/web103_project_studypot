import { useState } from 'react'
import { apiRequest } from '../api.js'

function getLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function CreateSessionModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const session = Object.fromEntries(formData.entries())

    try {
      await apiRequest('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, creator_id: 1 }),
      })
      onCreated()
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !saving) {
      onClose()
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <section
        className="create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-heading"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Bring your study crew together</p>
            <h2 id="create-session-heading">Create a session</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close create session form"
            disabled={saving}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="session-form" onSubmit={handleSubmit}>
          <label>
            <span>Session title</span>
            <input name="title" type="text" maxLength="150" required autoFocus />
          </label>
          <label>
            <span>Subject</span>
            <input name="subject" type="text" maxLength="100" required />
          </label>
          <div className="form-row">
            <label>
              <span>Date</span>
              <input name="session_date" type="date" min={getLocalDate()} required />
            </label>
            <label>
              <span>Time</span>
              <input name="session_time" type="time" required />
            </label>
          </div>
          <label>
            <span>Location</span>
            <input name="location" type="text" maxLength="200" required />
          </label>
          <label>
            <span>Description <span className="optional-label">(optional)</span></span>
            <textarea name="description" rows="3" maxLength="5000" />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button className="button button-secondary" type="button" disabled={saving} onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create session'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CreateSessionModal
