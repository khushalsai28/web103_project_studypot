import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, describe, it } from 'node:test'
import express from 'express'
import { createSessionsRouter } from '../src/routes/sessions.js'

const sampleSession = {
  id: 1,
  creator_id: 1,
  title: 'Calculus group',
  subject: 'Mathematics',
  description: 'Practice integration.',
  session_date: '2026-11-01',
  session_time: '14:00:00',
  location: 'Library',
}

async function createTestServer() {
  const calls = []
  let duplicateMembership = false
  let hasMembership = true
  const pool = {
    async query(sql, values = []) {
      calls.push({ sql, values })

      if (sql.includes('INSERT INTO study_sessions')) {
        return { rows: [{ ...sampleSession, ...Object.fromEntries(
          ['title', 'subject', 'description', 'session_date', 'session_time', 'location']
            .map((field, index) => [field, values[index + 1]]),
        ) }] }
      }

      if (sql.startsWith('UPDATE study_sessions')) {
        const row = values.at(-1) === 1
          ? { ...sampleSession, [sql.match(/SET (\w+)/)?.[1]]: values[0] }
          : undefined
        return { rows: row ? [row] : [] }
      }

      if (sql.startsWith('DELETE FROM study_sessions')) {
        return { rowCount: values[0] === 1 ? 1 : 0 }
      }

      if (sql.startsWith('SELECT id FROM study_sessions')) {
        return { rows: values[0] === 1 ? [{ id: 1 }] : [] }
      }

      if (sql.startsWith('SELECT id FROM students')) {
        return { rows: values[0] === 1 ? [{ id: 1 }] : [] }
      }

      if (sql.includes('INSERT INTO session_memberships')) {
        return {
          rows: duplicateMembership ? [] : [{
            student_id: values[0],
            session_id: values[1],
            joined_at: '2026-10-30T12:00:00.000Z',
          }],
        }
      }

      if (sql.startsWith('DELETE FROM session_memberships')) {
        return {
          rows: hasMembership ? [{ student_id: values[1], session_id: values[0] }] : [],
        }
      }

      if (sql.includes('WHERE s.id = $1')) {
        return { rows: values[0] === 1 ? [{ ...sampleSession, participants: [] }] : [] }
      }

      return { rows: [{ ...sampleSession, participant_count: 2 }] }
    },
  }

  const app = express()
  app.use(express.json())
  app.use('/sessions', createSessionsRouter(pool))
  const server = app.listen(0)
  await once(server, 'listening')
  const address = server.address()

  return {
    calls,
    setDuplicateMembership: (value) => { duplicateMembership = value },
    setHasMembership: (value) => { hasMembership = value },
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    }),
    url: `http://127.0.0.1:${address.port}/sessions`,
  }
}

describe('study session API', () => {
  let testServer

  before(async () => {
    testServer = await createTestServer()
  })

  after(async () => {
    await testServer.close()
  })

  it('lists sessions with parameterized search and subject filters', async () => {
    const response = await fetch(`${testServer.url}?search=calc&subject=Mathematics&upcoming=true`)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.sessions[0].id, 1)
    assert.deepEqual(testServer.calls.at(-1).values, ['%calc%', 'Mathematics'])
    assert.match(testServer.calls.at(-1).sql, /session_date >= CURRENT_DATE/)
  })

  it('returns a session and its participants by id', async () => {
    const response = await fetch(`${testServer.url}/1`)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.session.title, sampleSession.title)
    assert.deepEqual(body.session.participants, [])
  })

  it('joins a session and rejects duplicate memberships', async () => {
    const response = await fetch(`${testServer.url}/1/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_id: 1 }),
    })
    assert.equal(response.status, 201)

    const missingStudent = await fetch(`${testServer.url}/1/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_id: 2 }),
    })
    assert.equal(missingStudent.status, 404)

    const missingSession = await fetch(`${testServer.url}/2/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_id: 1 }),
    })
    assert.equal(missingSession.status, 404)

    testServer.setDuplicateMembership(true)
    const duplicate = await fetch(`${testServer.url}/1/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ student_id: 1 }),
    })
    assert.equal(duplicate.status, 409)
    testServer.setDuplicateMembership(false)
  })

  it('leaves a session and reports missing memberships', async () => {
    const response = await fetch(`${testServer.url}/1/members/1`, { method: 'DELETE' })
    assert.equal(response.status, 204)

    testServer.setHasMembership(false)
    const missing = await fetch(`${testServer.url}/1/members/1`, { method: 'DELETE' })
    assert.equal(missing.status, 404)
    testServer.setHasMembership(true)
  })

  it('rejects invalid session ids', async () => {
    const response = await fetch(`${testServer.url}/invalid`)
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.match(body.error, /positive integer/)
  })

  it('validates required fields before creating a session', async () => {
    const callCount = testServer.calls.length
    const response = await fetch(testServer.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Missing details' }),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(testServer.calls.length, callCount)
    assert.ok(body.details.includes('subject is required'))
  })

  it('creates a session with validated fields', async () => {
    const response = await fetch(testServer.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...sampleSession,
        creator_id: 1,
      }),
    })
    const body = await response.json()

    assert.equal(response.status, 201)
    assert.equal(body.session.title, sampleSession.title)
    assert.match(testServer.calls.at(-1).sql, /INSERT INTO session_memberships/)
  })

  it('updates supplied session fields', async () => {
    const response = await fetch(`${testServer.url}/1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title' }),
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(testServer.calls.at(-1).values[0], 'Updated title')
    assert.equal(body.session.title, 'Updated title')
  })

  it('deletes sessions and reports missing records', async () => {
    const deleted = await fetch(`${testServer.url}/1`, { method: 'DELETE' })
    const missing = await fetch(`${testServer.url}/2`, { method: 'DELETE' })

    assert.equal(deleted.status, 204)
    assert.equal(missing.status, 404)
  })
})
