import request, { ApiResponse } from './request';

export interface UserDTO {
  id: number;
  nickName: string;
  icon?: string;
}

export function getCurrentUser() {
  return request.get<ApiResponse<UserDTO>>('/user/me');
}
