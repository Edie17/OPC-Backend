import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  res => res,
  err => {
    console.error('[API]', err.response?.status, err.config?.url, err.message)
    return Promise.reject(err)
  }
)

export default client
