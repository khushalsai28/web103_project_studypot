import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api.js'
import { formatSessionDate, formatSessionTime } from '../lib/formatters.js'

const DEMO_STUDENT_ID = 1

function SessionDetails() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [membershipPending, setMembershipPending] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [participantRefreshFailed, setParticipantRefreshFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSession() {
      setLoading(true)
      setError('')

      try {
        const data = await apiRequest(`/sessions/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        })
        setSession(data.session)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message)
          setSession(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSession()
    return () => controller.abort()
  }, [id, retryToken])

  async function handleMembershipChange() {
    if (!session) {
      return
    }

    const isMember = session.participants.some(
      (participant) => participant.id === DEMO_STUDENT_ID,
    )
    setMembershipPending(true)
    setActionError('')
    setNotice('')
    let membershipUpdated = false

    try {
      if (isMember) {
        await apiRequest(
          `/sessions/${encodeURIComponent(id)}/members/${DEMO_STUDENT_ID}`,
          { method: 'DELETE' },
        )
        membershipUpdated = true
        setNotice('You left this study session.')
      } else {
        await apiRequest(`/sessions/${encodeURIComponent(id)}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: DEMO_STUDENT_ID }),
        })
        membershipUpdated = true
        setNotice('You joined this study session.')
      }

      const data = await apiRequest(`/sessions/${encodeURIComponent(id)}`)
      setSession(data.session)
      setParticipantRefreshFailed(false)
    } catch (requestError) {
      if (membershipUpdated) {
        setParticipantRefreshFailed(true)
        setActionError(`Your membership changed, but the participant list could not refresh: ${requestError.message}`)
      } else {
        setActionError(requestError.message)
      }
    } finally {
      setMembershipPending(false)
    }
  }

  if (loading) {
    return <main className="page-content"><p className="status-panel" role="status">Loading session details…</p></main>
  }

  if (error || !session) {
    return (
      <main className="page-content">
        <Link className="text-link back-link" to="/">← Back to sessions</Link>
        <section className="status-panel error-panel" role="alert">
          <p>{error || 'Study session not found.'}</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  const isMember = session.participants.some(
    (participant) => participant.id === DEMO_STUDENT_ID,
  )

  return (
    <main className="page-content details-content">
      <Link className="text-link back-link" to="/">← Back to sessions</Link>

      <section className="details-heading">
        <span className="subject-pill">{session.subject}</span>
        <h1>{session.title}</h1>
        <p>{session.description || 'The host has not added a description yet.'}</p>
      </section>

      <div className="details-grid">
        <section className="information-panel" aria-labelledby="information-heading">
          <h2 id="information-heading">Session information</h2>
          <dl className="session-information">
            <div>
              <dt>Date</dt>
              <dd>{formatSessionDate(session.session_date)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatSessionTime(session.session_time)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{session.location}</dd>
            </div>
            <div>
              <dt>Hosted by</dt>
              <dd>{session.creator_name}</dd>
            </div>
          </dl>
        </section>

        <aside className="membership-panel" aria-labelledby="membership-heading">
          <h2 id="membership-heading">{isMember ? 'You’re in this session' : 'Join this session'}</h2>
          <p>
            {session.participant_count} {session.participant_count === 1 ? 'student has' : 'students have'} joined.
          </p>
          <p>Meet the group and study together.</p>
          <button
            className={`button ${isMember ? 'button-secondary' : 'button-primary'} membership-button`}
            type="button"
            disabled={membershipPending}
            onClick={handleMembershipChange}
          >
            {membershipPending
              ? 'Updating…'
              : isMember ? 'Leave session' : 'Join session'}
          </button>
          <p className="membership-hint">You can change your RSVP at any time.</p>
          {actionError && <p className="form-error" role="alert">{actionError}</p>}
          {participantRefreshFailed && (
            <button
              className="text-link refresh-participants"
              type="button"
              onClick={() => {
                setActionError('')
                setRetryToken((token) => token + 1)
              }}
            >
              Refresh participant list
            </button>
          )}
          {notice && <p className="success-notice" role="status">{notice}</p>}
        </aside>
      </div>

      <section className="participants-section" aria-labelledby="participants-heading">
        <div className="section-heading">
          <h2 id="participants-heading">Participants</h2>
          <span className="result-count">{session.participant_count} joined</span>
        </div>
        {session.participants.length > 0 ? (
          <ul className="participant-list">
            {session.participants.map((participant) => (
              <li className="participant-card" key={participant.id}>
                <span className="participant-avatar" aria-hidden="true">
                  {participant.name.slice(0, 1).toLocaleUpperCase()}
                </span>
                <span>{participant.name}</span>
                {participant.id === session.creator_id && <span className="host-label">Host</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="status-panel">No one has joined yet. Be the first to join this session.</p>
        )}
      </section>
    </main>
  )
}

export default SessionDetails
