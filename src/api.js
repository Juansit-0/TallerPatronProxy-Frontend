export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function request(path, options) {
  const response = await fetch(API_URL + path, options)
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}

export const getSummary = () => request('/api/metrics/summary')

export const simulateLoad = () => request('/api/metrics/simulate-load', { method: 'POST' })

export function getLogs(filters, page) {
  const query = new URLSearchParams({ page, size: 10 })
  if (filters.service) query.set('service', filters.service)
  if (filters.status) query.set('status', filters.status)
  if (filters.from) query.set('from', new Date(filters.from).toISOString())
  if (filters.to) query.set('to', new Date(filters.to).toISOString())
  return request(`/api/metrics/logs?${query}`)
}
