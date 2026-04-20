package com.hmdp.service;

public interface RateLimitService {
    boolean tryAcquire(String key, int limit, int windowSeconds);
}
