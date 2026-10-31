export async function apiRequest(path, options = {}) {
  const { headers, ...requestOptions } = options
  const response = await fetch(`/api${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  })
  const data = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`)
  }

  return data
}
