package com.hmdp.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.hmdp.dto.Result;
import com.hmdp.entity.Shop;
import com.hmdp.service.IShopService;
import com.hmdp.utils.SystemConstants;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Positive;

@Validated
@RestController
@RequestMapping("/shop")
public class ShopController {

    @Resource
    public IShopService shopService;

    @GetMapping("/{id}")
    public Result queryShopById(@PathVariable("id") @Positive(message = "商铺id必须为正数") Long id) throws InterruptedException {
        return shopService.queryById(id);
    }

    @PostMapping
    public Result saveShop(@Valid @RequestBody Shop shop) {
        shopService.save(shop);
        return Result.ok(shop.getId());
    }

    @PutMapping
    public Result updateShop(@Valid @RequestBody Shop shop) {
        return shopService.update(shop);
    }

    @GetMapping("/of/type")
    public Result queryShopByType(
            @RequestParam("typeId") @Positive(message = "商铺类型id必须为正数") Integer typeId,
            @RequestParam(value = "current", defaultValue = "1") @Min(value = 1, message = "页码必须从1开始") Integer current,
            @RequestParam(value = "x", required = false) Double x,
            @RequestParam(value = "y", required = false) Double y
    ) {
        return shopService.queryShopByType(typeId, current, x, y);
    }

    @GetMapping("/of/name")
    public Result queryShopByName(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "current", defaultValue = "1") @Min(value = 1, message = "页码必须从1开始") Integer current
    ) {
        Page<Shop> page = shopService.query()
                .like(StrUtil.isNotBlank(name), "name", name)
                .page(new Page<>(current, SystemConstants.MAX_PAGE_SIZE));
        return Result.ok(page.getRecords());
    }
}
