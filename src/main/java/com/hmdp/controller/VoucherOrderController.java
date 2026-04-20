package com.hmdp.controller;

import com.hmdp.dto.Result;
import com.hmdp.service.IVoucherOrderService;
import com.hmdp.service.RateLimitService;
import com.hmdp.utils.UserHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.constraints.Positive;

@Validated
@RestController
@RequestMapping("/voucher-order")
public class VoucherOrderController {
    private static final String SECKILL_GLOBAL_RATE_KEY = "seckill:rate:global";
    private static final String SECKILL_USER_RATE_KEY_PREFIX = "seckill:rate:user:";
    private static final int GLOBAL_LIMIT = 100;
    private static final int GLOBAL_WINDOW_SECONDS = 1;
    private static final int USER_LIMIT = 3;
    private static final int USER_WINDOW_SECONDS = 5;

    @Resource
    private IVoucherOrderService voucherOrderService;

    @Resource
    private RateLimitService rateLimitService;

    @PostMapping("seckill/{id}")
    public Result seckillVoucher(@PathVariable("id") @Positive(message = "voucher id must be positive") Long voucherId) {
        // Limit before Redis stock check and MQ enqueue to protect the seckill entry.
        if (!rateLimitService.tryAcquire(SECKILL_GLOBAL_RATE_KEY, GLOBAL_LIMIT, GLOBAL_WINDOW_SECONDS)) {
            return Result.fail("当前秒杀请求过多，请稍后重试");
        }
        Long userId = UserHolder.getUser().getId();
        String userRateKey = SECKILL_USER_RATE_KEY_PREFIX + userId;
        if (!rateLimitService.tryAcquire(userRateKey, USER_LIMIT, USER_WINDOW_SECONDS)) {
            return Result.fail("请求过于频繁，请稍后再试");
        }
        return voucherOrderService.seckillVoucher(voucherId);
    }
}
