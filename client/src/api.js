export async function apiRequest(path, options = {}) {
  const { headers, ...requestOptions } = options
  const response = await fetch(`/api${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  })
  const responseText = await response.text()
  let data = null

  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        throw new Error('Server returned an invalid JSON response')
      }
    }
  }

  if (!response.ok) {
    if (response.status === 502) {
      throw new Error(
        'The API server is unavailable. Start the backend and check its database configuration, then retry.',
      )
    }

    throw new Error(
      data?.error ?? `Request failed with status ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
    )
  }

  return data
}
