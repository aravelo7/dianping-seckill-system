package com.hmdp.service;

import com.hmdp.dto.CacheStressTestRequest;
import com.hmdp.dto.CacheStressTestResultDTO;

public interface CacheStressTestService {
    CacheStressTestResultDTO run(CacheStressTestRequest request);
}
