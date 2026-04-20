package com.hmdp.service.impl;

import com.hmdp.dto.CacheMetricsDTO;
import com.hmdp.dto.CacheStressTestRequest;
import com.hmdp.dto.CacheStressTestResultDTO;
import com.hmdp.dto.Result;
import com.hmdp.metrics.CacheMetricsService;
import com.hmdp.service.CacheStressTestService;
import com.hmdp.utils.RedisConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Service
public class CacheStressTestServiceImpl implements CacheStressTestService {
    private static final int STRESS_TIMEOUT_SECONDS = 30;

    private final RestTemplate restTemplate;

    @Value("${server.port}")
    private int serverPort;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private CacheMetricsService cacheMetricsService;

    public CacheStressTestServiceImpl() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public CacheStressTestResultDTO run(CacheStressTestRequest request) {
        Long shopId = request.getShopId();
        int requestCount = request.getRequestCount();
        int concurrency = Math.min(request.getConcurrency(), requestCount);
        boolean clearCache = Boolean.TRUE.equals(request.getClearCacheBeforeTest());

        if (clearCache) {
            stringRedisTemplate.delete(RedisConstants.CACHE_SHOP_KEY + shopId);
        }

        CacheMetricsDTO before = cacheMetricsService.snapshot(10);
        ExecutorService executor = Executors.newFixedThreadPool(concurrency);
        List<Callable<RequestStat>> tasks = new ArrayList<>(requestCount);
        String url = "http://127.0.0.1:" + serverPort + "/shop/" + shopId;
        for (int i = 0; i < requestCount; i++) {
            tasks.add(() -> {
                long start = System.nanoTime();
                boolean success = false;
                try {
                    ResponseEntity<Result> response = restTemplate.getForEntity(url, Result.class);
                    Result result = response.getBody();
                    success = result != null && Boolean.TRUE.equals(result.getSuccess());
                } catch (Exception ignored) {
                    success = false;
                }
                long costMs = Math.max(1, (System.nanoTime() - start) / 1_000_000);
                return new RequestStat(success, costMs);
            });
        }

        long totalStart = System.currentTimeMillis();
        List<RequestStat> stats = new ArrayList<>(requestCount);
        try {
            List<Future<RequestStat>> futures = executor.invokeAll(tasks, STRESS_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            for (Future<RequestStat> future : futures) {
                try {
                    stats.add(future.get());
                } catch (Exception ignored) {
                    stats.add(new RequestStat(false, 0));
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdownNow();
        }
        long totalDurationMs = Math.max(1, System.currentTimeMillis() - totalStart);

        int successCount = (int) stats.stream().filter(RequestStat::isSuccess).count();
        int failCount = stats.size() - successCount;
        List<Long> costs = new ArrayList<>();
        for (RequestStat stat : stats) {
            costs.add(stat.getCostMs());
        }
        long min = costs.isEmpty() ? 0 : Collections.min(costs);
        long max = costs.isEmpty() ? 0 : Collections.max(costs);
        double avg = costs.isEmpty() ? 0.0 : costs.stream().mapToLong(Long::longValue).average().orElse(0.0);

        CacheMetricsDTO after = cacheMetricsService.snapshot(10);
        CacheMetricsDTO delta = delta(before, after);

        return new CacheStressTestResultDTO(
                shopId,
                requestCount,
                concurrency,
                clearCache,
                totalDurationMs,
                avg,
                min,
                max,
                successCount,
                failCount,
                delta
        );
    }

    private CacheMetricsDTO delta(CacheMetricsDTO before, CacheMetricsDTO after) {
        long total = after.getTotalQueryCount() - before.getTotalQueryCount();
        long hit = after.getCacheHitCount() - before.getCacheHitCount();
        long nullHit = after.getNullCacheHitCount() - before.getNullCacheHitCount();
        double hitRate = total == 0 ? 0.0 : (double) (hit + nullHit) / total;
        return new CacheMetricsDTO(
                total,
                hit,
                after.getCacheMissCount() - before.getCacheMissCount(),
                nullHit,
                after.getLogicalExpireTriggerCount() - before.getLogicalExpireTriggerCount(),
                after.getCacheRebuildCount() - before.getCacheRebuildCount(),
                after.getDbFallbackCount() - before.getDbFallbackCount(),
                hitRate,
                LocalDateTime.now(),
                after.getTopHotKeys()
        );
    }

    private static class RequestStat {
        private final boolean success;
        private final long costMs;

        RequestStat(boolean success, long costMs) {
            this.success = success;
            this.costMs = costMs;
        }

        boolean isSuccess() {
            return success;
        }

        long getCostMs() {
            return costMs;
        }
    }
}
