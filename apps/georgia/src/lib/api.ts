export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'blob' | 'text';
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { params, responseType = 'json', headers = {}, ...init } = config;

  let url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('crystal_jwt');
  const requestHeaders = new Headers(headers as HeadersInit);
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (!(init.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  } else if (init.body instanceof FormData && requestHeaders.get('Content-Type') === 'multipart/form-data') {
    requestHeaders.delete('Content-Type');
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  if (response.status === 401) {
    console.warn('[API] 401 Unauthorized - token missing or expired.');
  }

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    const error: any = new Error(errorData?.error || response.statusText || 'API Request Failed');
    error.response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  let data: any;
  if (responseType === 'blob') {
    data = await response.blob();
  } else if (responseType === 'text') {
    data = await response.text();
  } else {
    data = await response.json();
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

export const api = {
  get: <T = any>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'GET' }),
  post: <T = any>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'PUT',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(url: string, body?: any, config?: RequestConfig) =>
    request<T>(url, {
      ...config,
      method: 'PATCH',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'DELETE' }),
};

export default api;
