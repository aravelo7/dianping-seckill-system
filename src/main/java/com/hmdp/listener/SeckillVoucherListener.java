package com.hmdp.listener;

import cn.hutool.json.JSONUtil;
import com.hmdp.entity.VoucherOrder;
import com.hmdp.service.impl.VoucherOrderServiceImpl;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeckillVoucherListener {

    @Resource
    private VoucherOrderServiceImpl voucherOrderService;

    @RabbitListener(queues = "QA")
    public void receivedA(Message message, Channel channel) {
        String msg = new String(message.getBody());
        VoucherOrder voucherOrder = JSONUtil.toBean(msg, VoucherOrder.class);
        log.info("秒杀订单正常队列：{}", voucherOrder);
        voucherOrderService.handleVoucherOrder(voucherOrder);
    }

    @RabbitListener(queues = "QD")
    public void receivedD(Message message) {
        String msg = new String(message.getBody());
        VoucherOrder voucherOrder = JSONUtil.toBean(msg, VoucherOrder.class);
        log.info("秒杀订单死信队列：{}", voucherOrder);
        voucherOrderService.handleVoucherOrder(voucherOrder);
    }
}
