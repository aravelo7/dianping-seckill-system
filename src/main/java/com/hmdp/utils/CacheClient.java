package com.hmdp.utils;

import cn.hutool.core.util.BooleanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.hmdp.metrics.CacheMetricsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Slf4j
@Component
public class CacheClient {
    private static final ExecutorService CACHE_REBUILD_EXECUTOR = Executors.newFixedThreadPool(10);

    private final StringRedisTemplate stringRedisTemplate;
    private final CacheMetricsService cacheMetricsService;

    public CacheClient(StringRedisTemplate stringRedisTemplate, CacheMetricsService cacheMetricsService) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.cacheMetricsService = cacheMetricsService;
    }

    public void set(String key, Object value, Long time, TimeUnit unit) {
        stringRedisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(value), time, unit);
    }

    public void setWithLogicalExpire(String key, Object value, Long time, TimeUnit unit) {
        RedisData redisData = new RedisData();
        redisData.setData(value);
        redisData.setExpireTime(LocalDateTime.now().plusSeconds(unit.toSeconds(time)));
        stringRedisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(redisData));
    }

    public <R, ID> R queryWithPassThrough(
            String keyPrefix, ID id, Class<R> type, Function<ID, R> dbFallback, Long time, TimeUnit unit) {
        String key = keyPrefix + id;
        cacheMetricsService.recordQuery(key);

        String json = stringRedisTemplate.opsForValue().get(key);
        if (StrUtil.isNotBlank(json)) {
            cacheMetricsService.recordCacheHit(key);
            return JSONUtil.toBean(json, type);
        }
        if (json != null) {
            cacheMetricsService.recordNullCacheHit(key);
            return null;
        }

        cacheMetricsService.recordCacheMiss(key);
        cacheMetricsService.recordDbFallback(key);
        R r = dbFallback.apply(id);
        if (r == null) {
            stringRedisTemplate.opsForValue().set(key, "", RedisConstants.CACHE_NULL_TTL, TimeUnit.MINUTES);
            return null;
        }

        this.set(key, r, time, unit);
        return r;
    }

    public <R, ID> R queryWithLogicalExpire(
            String keyPrefix, ID id, Class<R> type, Function<ID, R> dbFallback, Long time, TimeUnit unit) {
        String key = keyPrefix + id;
        cacheMetricsService.recordQuery(key);

        String json = stringRedisTemplate.opsForValue().get(key);
        if (StrUtil.isBlank(json)) {
            cacheMetricsService.recordCacheMiss(key);
            return null;
        }

        cacheMetricsService.recordCacheHit(key);
        RedisData redisData = JSONUtil.toBean(json, RedisData.class);
        R data = JSONUtil.toBean((JSONObject) redisData.getData(), type);
        LocalDateTime expireTime = redisData.getExpireTime();
        if (expireTime.isAfter(LocalDateTime.now())) {
            return data;
        }

        // Logical expiration returns stale data first, then rebuilds cache asynchronously.
        cacheMetricsService.recordLogicalExpire(key);
        String lockKey = RedisConstants.LOCK_SHOP_KEY + id;
        boolean isLock = tryLock(lockKey);
        if (isLock) {
            cacheMetricsService.recordCacheRebuild(key);
            CACHE_REBUILD_EXECUTOR.submit(() -> {
                try {
                    cacheMetricsService.recordDbFallback(key);
                    R r = dbFallback.apply(id);
                    this.setWithLogicalExpire(key, r, time, unit);
                } catch (Exception e) {
                    log.error("cache rebuild failed, key={}", key, e);
                } finally {
                    unLock(lockKey);
                }
            });
        }

        return data;
    }

    private boolean tryLock(String key) {
        Boolean flag = stringRedisTemplate.opsForValue().setIfAbsent(key, "1", 10, TimeUnit.SECONDS);
        return BooleanUtil.isTrue(flag);
    }

    private void unLock(String key) {
        stringRedisTemplate.delete(key);
    }
}
