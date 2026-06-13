// services/api-client.ts
// Base HTTP client — all services use this

type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  errors?: { field: string; message: string }[]
  meta?: { total: number; page: number }
}

class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

async function request<T = any>(
  method: string,
  url: string,
  body?: Record<string, any>
): Promise<ApiResponse<T>> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const json: ApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    const code = json.error?.code ?? 'UNKNOWN_ERROR'
    const message = json.error?.message ?? 'Something went wrong'
    throw new ApiError(code, message)
  }

  return json
}

export const apiClient = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, body: Record<string, any>) => request<T>('POST', url, body),
  patch: <T = any>(url: string, body: Record<string, any>) => request<T>('PATCH', url, body),
  put: <T = any>(url: string, body: Record<string, any>) => request<T>('PUT', url, body),
  delete: <T = any>(url: string) => request<T>('DELETE', url),
}

export { ApiError }
