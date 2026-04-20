package com.hmdp.metrics;

import com.hmdp.dto.CacheMetricsDTO;
import com.hmdp.dto.HotKeyDTO;

import java.util.List;

public interface CacheMetricsService {
    void recordQuery(String key);

    void recordCacheHit(String key);

    void recordCacheMiss(String key);

    void recordNullCacheHit(String key);

    void recordLogicalExpire(String key);

    void recordCacheRebuild(String key);

    void recordDbFallback(String key);

    CacheMetricsDTO snapshot(int hotKeyLimit);

    List<HotKeyDTO> topHotKeys(int limit);

    void reset();
}
