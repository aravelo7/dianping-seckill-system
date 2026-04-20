package com.hmdp.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
public class CacheStressTestRequest {
    @NotNull(message = "shopId must not be null")
    @Min(value = 1, message = "shopId must be positive")
    private Long shopId = 1L;

    @NotNull(message = "requestCount must not be null")
    @Min(value = 1, message = "requestCount must be at least 1")
    @Max(value = 1000, message = "requestCount must be at most 1000")
    private Integer requestCount = 50;

    @NotNull(message = "concurrency must not be null")
    @Min(value = 1, message = "concurrency must be at least 1")
    @Max(value = 100, message = "concurrency must be at most 100")
    private Integer concurrency = 10;

    private Boolean clearCacheBeforeTest = false;
}
