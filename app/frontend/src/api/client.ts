import axios from 'axios'

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'X-CSRF-Token': csrfToken(),
    Accept: 'application/json',
  },
})
