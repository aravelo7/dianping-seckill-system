package com.hmdp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tb_shop")
public class Shop implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @NotBlank(message = "shop name must not be blank")
    private String name;

    @NotNull(message = "shop type must not be null")
    @Positive(message = "shop type must be positive")
    private Long typeId;

    private String images;

    private String area;

    @NotBlank(message = "shop address must not be blank")
    private String address;

    @NotNull(message = "longitude must not be null")
    private Double x;

    @NotNull(message = "latitude must not be null")
    private Double y;

    private Long avgPrice;

    private Integer sold;

    private Integer comments;

    private Integer score;

    private String openHours;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableField(exist = false)
    private Double distance;
}
