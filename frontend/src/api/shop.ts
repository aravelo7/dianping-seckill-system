import request, { ApiResponse } from './request';

export interface ShopDTO {
  id: number;
  name?: string;
  typeId?: number;
  address?: string;
  images?: string;
  score?: number;
  comments?: number;
  avgPrice?: number;
  openHours?: string;
}

export function getShop(id: string | number) {
  return request.get<ApiResponse<ShopDTO>>(`/shop/${id}`);
}
