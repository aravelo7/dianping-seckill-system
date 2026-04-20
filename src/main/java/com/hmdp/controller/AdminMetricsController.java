package com.hmdp.controller;

import com.hmdp.dto.CacheStressTestRequest;
import com.hmdp.dto.Result;
import com.hmdp.metrics.CacheMetricsService;
import com.hmdp.service.AdminAuthService;
import com.hmdp.service.CacheStressTestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;

@RestController
@RequestMapping("/admin/cache")
public class AdminMetricsController {
    @Resource
    private CacheMetricsService cacheMetricsService;

    @Resource
    private AdminAuthService adminAuthService;

    @Resource
    private CacheStressTestService cacheStressTestService;

    @GetMapping("/metrics")
    public Result metrics(@RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        if (!adminAuthService.isCurrentUserAdmin()) {
            return Result.fail("no permission");
        }
        return Result.ok(cacheMetricsService.snapshot(limit));
    }

    @GetMapping("/hotkeys")
    public Result hotKeys(@RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        if (!adminAuthService.isCurrentUserAdmin()) {
            return Result.fail("no permission");
        }
        return Result.ok(cacheMetricsService.topHotKeys(limit));
    }

    @PostMapping("/metrics/reset")
    public Result reset() {
        if (!adminAuthService.isCurrentUserAdmin()) {
            return Result.fail("no permission");
        }
        cacheMetricsService.reset();
        return Result.ok();
    }

    @PostMapping("/stress-test")
    public Result stressTest(@Valid @RequestBody CacheStressTestRequest request) {
        if (!adminAuthService.isCurrentUserAdmin()) {
            return Result.fail("no permission");
        }
        return Result.ok(cacheStressTestService.run(request));
    }
}
