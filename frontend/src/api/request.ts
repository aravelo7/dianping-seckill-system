import axios from 'axios';
import { getToken } from '../utils/auth';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  errorMsg?: string;
  total?: number;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default request;
