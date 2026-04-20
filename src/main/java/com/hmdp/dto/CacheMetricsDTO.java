package com.hmdp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CacheMetricsDTO {
    private Long totalQueryCount;
    private Long cacheHitCount;
    private Long cacheMissCount;
    private Long nullCacheHitCount;
    private Long logicalExpireTriggerCount;
    private Long cacheRebuildCount;
    private Long dbFallbackCount;
    private Double hitRate;
    private LocalDateTime lastCacheRebuildTime;
    private List<HotKeyDTO> topHotKeys;
}
