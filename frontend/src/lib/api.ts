import type {
  ChangeOrder,
  Project,
  ProjectStats,
  RequestItem,
  TokenResponse,
  User,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

let authToken: string | null = localStorage.getItem('sw_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('sw_token', token);
  else localStorage.removeItem('sw_token');
}

export function getToken() {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && authToken && path !== '/api/auth/login') {
    setToken(null);
    window.location.hash = '#login';
    throw new ApiError(401, 'Sessão expirada');
  }

  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail.length > 0) {
        detail = body.detail.map((d: { msg?: string }) => d.msg ?? '').join('; ');
      }
    } catch {
      /* keep generic message */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/api/auth/me'),

  listProjects: () => request<Project[]>('/api/projects'),
  getProject: (id: number) => request<Project>(`/api/projects/${id}`),
  createProject: (data: {
    title: string;
    hourly_rate: number;
    notes: string;
    scope_entries: { text: string }[];
  }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: number, data: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: number) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  projectStats: (id: number) => request<ProjectStats>(`/api/projects/${id}/stats`),

  addRequest: (projectId: number, text: string) =>
    request<RequestItem>(`/api/projects/${projectId}/requests`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  updateRequest: (
    projectId: number,
    requestId: number,
    data: { classification?: string; status?: string },
  ) =>
    request<RequestItem>(`/api/projects/${projectId}/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRequest: (projectId: number, requestId: number) =>
    request<void>(`/api/projects/${projectId}/requests/${requestId}`, { method: 'DELETE' }),

  listChangeOrders: (projectId: number) =>
    request<ChangeOrder[]>(`/api/projects/${projectId}/change-orders`),
  createChangeOrder: (
    projectId: number,
    data: {
      title: string;
      description: string;
      hours: number;
      rate: number;
      request_ids: number[];
    },
  ) =>
    request<ChangeOrder>(`/api/projects/${projectId}/change-orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateChangeOrder: (projectId: number, orderId: number, data: Partial<ChangeOrder>) =>
    request<ChangeOrder>(`/api/projects/${projectId}/change-orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteChangeOrder: (projectId: number, orderId: number) =>
    request<void>(`/api/projects/${projectId}/change-orders/${orderId}`, { method: 'DELETE' }),
};