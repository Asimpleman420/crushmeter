const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error('The API URL is not configured. Set VITE_API_URL and rebuild the frontend.')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'Something went wrong. Please try again.')
    error.status = response.status
    error.details = data?.details
    throw error
  }

  return data
}

export const api = {
  createQuiz: (creatorDisplayName = '') => request('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify({ creatorDisplayName }),
  }),
  getQuiz: (publicId) => request(`/api/quizzes/${encodeURIComponent(publicId)}`),
  submitQuiz: (publicId, body) => request(`/api/quizzes/${encodeURIComponent(publicId)}/submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  getManagedQuiz: (token) => request('/api/manage/quiz', { headers: { Authorization: `Bearer ${token}` } }),
  getSubmissions: (token, page) => request(`/api/manage/submissions?page=${page}&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  deleteSubmission: (token, id) => request(`/api/manage/submissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),
  deleteQuiz: (token) => request('/api/manage/quiz', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),
}
