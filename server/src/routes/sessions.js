import { Router } from 'express'

const editableFields = [
  'title',
  'subject',
  'description',
  'session_date',
  'session_time',
  'location',
]

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return date.getUTCFullYear() > 0 &&
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().startsWith(value)
}

function validateSessionFields(fields, { partial = false } = {}) {
  const errors = []
  const requiredFields = ['title', 'subject', 'session_date', 'session_time', 'location']

  for (const field of requiredFields) {
    if (!partial && (typeof fields[field] !== 'string' || !fields[field].trim())) {
      errors.push(`${field} is required`)
    } else if (partial && field in fields && (
      typeof fields[field] !== 'string' || !fields[field].trim()
    )) {
      errors.push(`${field} cannot be empty`)
    }
  }

  for (const field of ['title', 'subject', 'location']) {
    if (typeof fields[field] === 'string') {
      const maxLengths = { title: 150, subject: 100, location: 200 }
      if (fields[field].trim().length > maxLengths[field]) {
        errors.push(`${field} must be ${maxLengths[field]} characters or fewer`)
      }
    }
  }

  if ('description' in fields && fields.description !== null &&
      typeof fields.description !== 'string') {
    errors.push('description must be a string or null')
  }

  if (typeof fields.description === 'string' && fields.description.length > 5000) {
    errors.push('description must be 5000 characters or fewer')
  }

  if ('session_date' in fields && (
    typeof fields.session_date !== 'string' || !isValidDate(fields.session_date)
  )) {
    errors.push('session_date must be a valid date in YYYY-MM-DD format')
  }

  if ('session_time' in fields && (
    typeof fields.session_time !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(fields.session_time)
  )) {
    errors.push('session_time must be a valid time in HH:MM format')
  }

  return errors
}

function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function normalizeSessionFields(fields) {
  return {
    title: fields.title.trim(),
    subject: fields.subject.trim(),
    description: typeof fields.description === 'string' ? fields.description.trim() : null,
    session_date: fields.session_date,
    session_time: fields.session_time,
    location: fields.location.trim(),
  }
}

export function createSessionsRouter(pool) {
  const router = Router()

  router.get('/', async (request, response) => {
    const filters = []
    const values = []

    if (typeof request.query.search === 'string' && request.query.search.trim()) {
      values.push(`%${request.query.search.trim()}%`)
      filters.push(`(s.title ILIKE $${values.length} OR s.subject ILIKE $${values.length})`)
    }

    if (typeof request.query.subject === 'string' && request.query.subject.trim()) {
      values.push(request.query.subject.trim())
      filters.push(`s.subject ILIKE $${values.length}`)
    }

    if (request.query.upcoming === 'true') {
      filters.push('s.session_date >= CURRENT_DATE')
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const { rows } = await pool.query(
      `SELECT s.*, creator.name AS creator_name,
        (SELECT COUNT(*)::int FROM session_memberships m WHERE m.session_id = s.id)
          AS participant_count
       FROM study_sessions s
       JOIN students creator ON creator.id = s.creator_id
       ${where}
       ORDER BY s.session_date ASC, s.session_time ASC, s.id ASC`,
      values,
    )

    response.json({ sessions: rows })
  })

  router.get('/:id', async (request, response) => {
    const id = parseId(request.params.id)
    if (!id) {
      return response.status(400).json({ error: 'Session id must be a positive integer' })
    }

    const { rows } = await pool.query(
      `SELECT s.*, creator.name AS creator_name,
        COUNT(DISTINCT participant.id)::int AS participant_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', participant.id,
              'name', participant.name,
              'email', participant.email,
              'joined_at', membership.joined_at
            ) ORDER BY participant.name
          ) FILTER (WHERE participant.id IS NOT NULL),
          '[]'::json
        ) AS participants
       FROM study_sessions s
       JOIN students creator ON creator.id = s.creator_id
       LEFT JOIN session_memberships membership ON membership.session_id = s.id
       LEFT JOIN students participant ON participant.id = membership.student_id
       WHERE s.id = $1
       GROUP BY s.id, creator.name`,
      [id],
    )

    if (!rows[0]) {
      return response.status(404).json({ error: 'Study session not found' })
    }

    response.json({ session: rows[0] })
  })

  router.post('/:id/members', async (request, response) => {
    const sessionId = parseId(request.params.id)
    const studentId = parseId(request.body?.student_id)

    if (!sessionId || !studentId) {
      return response.status(400).json({
        error: 'Session id and student_id must be positive integers',
      })
    }

    const session = await pool.query(
      'SELECT id FROM study_sessions WHERE id = $1',
      [sessionId],
    )
    if (!session.rows[0]) {
      return response.status(404).json({ error: 'Study session not found' })
    }

    const student = await pool.query(
      'SELECT id FROM students WHERE id = $1',
      [studentId],
    )
    if (!student.rows[0]) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const membership = await pool.query(
      `INSERT INTO session_memberships (student_id, session_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, session_id) DO NOTHING
       RETURNING student_id, session_id, joined_at`,
      [studentId, sessionId],
    )

    if (!membership.rows[0]) {
      return response.status(409).json({ error: 'Student has already joined this session' })
    }

    response.status(201).json({ membership: membership.rows[0] })
  })

  router.delete('/:id/members/:studentId', async (request, response) => {
    const sessionId = parseId(request.params.id)
    const studentId = parseId(request.params.studentId)

    if (!sessionId || !studentId) {
      return response.status(400).json({
        error: 'Session id and student id must be positive integers',
      })
    }

    const { rows } = await pool.query(
      `DELETE FROM session_memberships
       WHERE session_id = $1 AND student_id = $2
       RETURNING student_id, session_id`,
      [sessionId, studentId],
    )

    if (!rows[0]) {
      return response.status(404).json({ error: 'Student is not a member of this session' })
    }

    response.status(204).end()
  })

  router.post('/', async (request, response) => {
    const fields = request.body && typeof request.body === 'object' &&
      !Array.isArray(request.body) ? request.body : {}
    const errors = validateSessionFields(fields)
    const creatorId = parseId(fields.creator_id)

    if (!creatorId) {
      errors.push('creator_id must be a positive integer')
    }

    if (errors.length) {
      return response.status(400).json({ error: 'Invalid session data', details: errors })
    }

    const creator = await pool.query(
      'SELECT id FROM students WHERE id = $1',
      [creatorId],
    )
    if (!creator.rows[0]) {
      return response.status(404).json({ error: 'Creator student not found' })
    }

    const normalized = normalizeSessionFields(fields)
    const { rows } = await pool.query(
      `WITH created_session AS (
         INSERT INTO study_sessions
           (creator_id, title, subject, description, session_date, session_time, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *
       ), creator_membership AS (
         INSERT INTO session_memberships (student_id, session_id)
         SELECT creator_id, id FROM created_session
         RETURNING session_id
       )
       SELECT created_session.*
       FROM created_session
       JOIN creator_membership ON creator_membership.session_id = created_session.id`,
      [
        creatorId,
        normalized.title,
        normalized.subject,
        normalized.description,
        normalized.session_date,
        normalized.session_time,
        normalized.location,
      ],
    )

    response.status(201).json({ session: rows[0] })
  })

  router.patch('/:id', async (request, response) => {
    const id = parseId(request.params.id)
    if (!id) {
      return response.status(400).json({ error: 'Session id must be a positive integer' })
    }

    const fields = request.body && typeof request.body === 'object' &&
      !Array.isArray(request.body) ? request.body : {}
    const changedFields = editableFields.filter((field) => field in fields)
    if (!changedFields.length) {
      return response.status(400).json({ error: 'Provide at least one editable session field' })
    }

    const errors = validateSessionFields(fields, { partial: true })
    if (errors.length) {
      return response.status(400).json({ error: 'Invalid session data', details: errors })
    }

    const values = changedFields.map((field) => (
      field === 'description' && fields[field] === '' ? null :
        typeof fields[field] === 'string' ? fields[field].trim() : fields[field]
    ))
    values.push(id)
    const assignments = changedFields.map(
      (field, index) => `${field} = $${index + 1}`,
    )

    const { rows } = await pool.query(
      `UPDATE study_sessions SET ${assignments.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    )

    if (!rows[0]) {
      return response.status(404).json({ error: 'Study session not found' })
    }

    response.json({ session: rows[0] })
  })

  router.delete('/:id', async (request, response) => {
    const id = parseId(request.params.id)
    if (!id) {
      return response.status(400).json({ error: 'Session id must be a positive integer' })
    }

    const { rowCount } = await pool.query(
      'DELETE FROM study_sessions WHERE id = $1',
      [id],
    )

    if (!rowCount) {
      return response.status(404).json({ error: 'Study session not found' })
    }

    response.status(204).end()
  })

  return router
}
