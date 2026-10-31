import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, describe, it } from 'node:test'
import express from 'express'
import { apiErrorHandler } from '../src/middleware/api-error-handler.js'

async function createTestServer() {
  const app = express()
  app.get('/database-error', (_request, _response, next) => {
    next(Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }))
  })
  app.get('/unexpected-error', (_request, _response, next) => {
    next(new Error('unexpected failure'))
  })
  app.use(apiErrorHandler)

  const server = app.listen(0)
  await once(server, 'listening')

  return {
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    }),
    url: `http://127.0.0.1:${server.address().port}`,
  }
}

describe('API error handler', () => {
  let testServer

  before(async () => {
    testServer = await createTestServer()
  })

  after(async () => {
    await testServer.close()
  })

  it('returns an actionable 503 when PostgreSQL is unavailable', async () => {
    const response = await fetch(`${testServer.url}/database-error`)
    const body = await response.json()

    assert.equal(response.status, 503)
    assert.match(body.error, /Start PostgreSQL and check DATABASE_URL/)
  })

  it('returns a generic 500 for unexpected errors', async () => {
    const response = await fetch(`${testServer.url}/unexpected-error`)
    const body = await response.json()

    assert.equal(response.status, 500)
    assert.equal(body.error, 'An unexpected server error occurred')
  })
})
