import request, { ApiResponse } from './request';

export interface LoginPayload {
  phone: string;
  code: string;
}

export function sendCode(phone: string) {
  return request.post<ApiResponse>(`/user/code?phone=${encodeURIComponent(phone)}`);
}

export function login(payload: LoginPayload) {
  return request.post<ApiResponse<string>>('/user/login', payload);
}
