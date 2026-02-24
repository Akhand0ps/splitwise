import request, { setToken } from './client';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}
