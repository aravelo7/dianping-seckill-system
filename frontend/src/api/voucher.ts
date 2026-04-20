import request, { ApiResponse } from './request';

export function seckillVoucher(id: string | number) {
  return request.post<ApiResponse<number | string>>(`/voucher-order/seckill/${id}`);
}
