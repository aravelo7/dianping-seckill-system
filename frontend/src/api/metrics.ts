import request, { ApiResponse } from './request';

export interface HotKeyDTO {
  key: string;
  count: number;
}

export interface CacheMetricsDTO {
  totalQueryCount: number;
  cacheHitCount: number;
  cacheMissCount: number;
  nullCacheHitCount: number;
  logicalExpireTriggerCount: number;
  cacheRebuildCount: number;
  dbFallbackCount: number;
  hitRate: number;
  lastCacheRebuildTime?: string;
  topHotKeys?: HotKeyDTO[];
}

export interface CacheStressTestRequest {
  shopId: number;
  requestCount: number;
  concurrency: number;
  clearCacheBeforeTest: boolean;
}

export interface CacheStressTestResultDTO {
  shopId: number;
  requestCount: number;
  concurrency: number;
  clearCacheBeforeTest: boolean;
  totalDurationMs: number;
  avgResponseMs: number;
  minResponseMs: number;
  maxResponseMs: number;
  successCount: number;
  failCount: number;
  cacheMetricsSnapshot: CacheMetricsDTO;
}

export function getCacheMetrics(limit = 10) {
  return request.get<ApiResponse<CacheMetricsDTO>>(`/admin/cache/metrics?limit=${limit}`);
}

export function getHotKeys(limit = 10) {
  return request.get<ApiResponse<HotKeyDTO[]>>(`/admin/cache/hotkeys?limit=${limit}`);
}

export function resetCacheMetrics() {
  return request.post<ApiResponse>('/admin/cache/metrics/reset');
}

export function runCacheStressTest(payload: CacheStressTestRequest) {
  return request.post<ApiResponse<CacheStressTestResultDTO>>('/admin/cache/stress-test', payload);
}
