package com.hmdp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CacheStressTestResultDTO {
    private Long shopId;
    private Integer requestCount;
    private Integer concurrency;
    private Boolean clearCacheBeforeTest;
    private Long totalDurationMs;
    private Double avgResponseMs;
    private Long minResponseMs;
    private Long maxResponseMs;
    private Integer successCount;
    private Integer failCount;
    private CacheMetricsDTO cacheMetricsSnapshot;
}
