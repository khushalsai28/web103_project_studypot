const databaseUnavailableCodes = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'EHOSTUNREACH',
  '57P01',
  '57P02',
  '57P03',
]

export function apiErrorHandler(error, _request, response, _next) {
  console.error('Unhandled API error:', error)

  if (databaseUnavailableCodes.includes(error.code)) {
    return response.status(503).json({
      error: 'The database is unavailable. Start PostgreSQL and check DATABASE_URL.',
    })
  }

  return response.status(500).json({ error: 'An unexpected server error occurred' })
}
