import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { apiRequest } from '../src/api.js'

async function withMockedFetch(mockFetch, callback) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

describe('apiRequest', () => {
  it('returns null for an empty successful response', async () => {
    await withMockedFetch(
      async () => new Response(null, { status: 204 }),
      async () => {
        assert.equal(await apiRequest('/sessions/1/members/1', { method: 'DELETE' }), null)
      },
    )
  })

  it('returns null for an empty successful response with status 200', async () => {
    await withMockedFetch(
      async () => new Response(null, { status: 200 }),
      async () => {
        assert.equal(await apiRequest('/sessions'), null)
      },
    )
  })

  it('parses JSON success responses', async () => {
    await withMockedFetch(
      async () => Response.json({ sessions: [] }),
      async () => {
        assert.deepEqual(await apiRequest('/sessions'), { sessions: [] })
      },
    )
  })

  it('uses the API error message from JSON error responses', async () => {
    await withMockedFetch(
      async () => Response.json({ error: 'Session not found' }, { status: 404 }),
      async () => {
        await assert.rejects(apiRequest('/sessions/999'), /Session not found/)
      },
    )
  })

  it('uses the HTTP status when an error response is not JSON', async () => {
    await withMockedFetch(
      async () => new Response('Service unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      }),
      async () => {
        await assert.rejects(apiRequest('/sessions'), /503 Service Unavailable/)
      },
    )
  })

  it('explains how to recover from an unavailable API proxy', async () => {
    await withMockedFetch(
      async () => new Response('Bad Gateway', {
        status: 502,
        statusText: 'Bad Gateway',
      }),
      async () => {
        await assert.rejects(
          apiRequest('/sessions'),
          /API server is unavailable.*Start the backend.*database configuration/,
        )
      },
    )
  })

  it('reports invalid JSON in a successful response', async () => {
    await withMockedFetch(
      async () => new Response('{not json', { status: 200 }),
      async () => {
        await assert.rejects(apiRequest('/sessions'), /invalid JSON response/)
      },
    )
  })
})
