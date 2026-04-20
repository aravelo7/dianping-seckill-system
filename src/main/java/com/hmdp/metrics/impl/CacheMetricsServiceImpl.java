package com.hmdp.metrics.impl;

import com.hmdp.dto.CacheMetricsDTO;
import com.hmdp.dto.HotKeyDTO;
import com.hmdp.metrics.CacheMetricsService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class CacheMetricsServiceImpl implements CacheMetricsService {
    private final AtomicLong totalQueryCount = new AtomicLong();
    private final AtomicLong cacheHitCount = new AtomicLong();
    private final AtomicLong cacheMissCount = new AtomicLong();
    private final AtomicLong nullCacheHitCount = new AtomicLong();
    private final AtomicLong logicalExpireTriggerCount = new AtomicLong();
    private final AtomicLong cacheRebuildCount = new AtomicLong();
    private final AtomicLong dbFallbackCount = new AtomicLong();
    private final ConcurrentHashMap<String, AtomicLong> hotKeyCounter = new ConcurrentHashMap<>();
    private volatile LocalDateTime lastCacheRebuildTime;

    @Override
    public void recordQuery(String key) {
        totalQueryCount.incrementAndGet();
        hotKeyCounter.computeIfAbsent(key, ignored -> new AtomicLong()).incrementAndGet();
    }

    @Override
    public void recordCacheHit(String key) {
        cacheHitCount.incrementAndGet();
    }

    @Override
    public void recordCacheMiss(String key) {
        cacheMissCount.incrementAndGet();
    }

    @Override
    public void recordNullCacheHit(String key) {
        nullCacheHitCount.incrementAndGet();
    }

    @Override
    public void recordLogicalExpire(String key) {
        logicalExpireTriggerCount.incrementAndGet();
    }

    @Override
    public void recordCacheRebuild(String key) {
        cacheRebuildCount.incrementAndGet();
        lastCacheRebuildTime = LocalDateTime.now();
    }

    @Override
    public void recordDbFallback(String key) {
        dbFallbackCount.incrementAndGet();
    }

    @Override
    public CacheMetricsDTO snapshot(int hotKeyLimit) {
        long total = totalQueryCount.get();
        long hit = cacheHitCount.get();
        long nullHit = nullCacheHitCount.get();
        double hitRate = total == 0 ? 0.0 : (double) (hit + nullHit) / total;
        return new CacheMetricsDTO(
                total,
                hit,
                cacheMissCount.get(),
                nullHit,
                logicalExpireTriggerCount.get(),
                cacheRebuildCount.get(),
                dbFallbackCount.get(),
                hitRate,
                lastCacheRebuildTime,
                topHotKeys(hotKeyLimit)
        );
    }

    @Override
    public List<HotKeyDTO> topHotKeys(int limit) {
        return hotKeyCounter.entrySet().stream()
                .map(entry -> new HotKeyDTO(entry.getKey(), entry.getValue().get()))
                .sorted(Comparator.comparing(HotKeyDTO::getCount).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public void reset() {
        totalQueryCount.set(0);
        cacheHitCount.set(0);
        cacheMissCount.set(0);
        nullCacheHitCount.set(0);
        logicalExpireTriggerCount.set(0);
        cacheRebuildCount.set(0);
        dbFallbackCount.set(0);
        hotKeyCounter.clear();
        lastCacheRebuildTime = null;
    }
}
