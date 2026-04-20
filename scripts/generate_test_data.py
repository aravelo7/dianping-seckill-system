#!/usr/bin/env python3
"""
Generate local mock data SQL for hm-dianping.

The generated SQL reads current MAX(id) values into MySQL session variables, so
it can be imported repeatedly without primary-key conflicts.
"""

from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "scripts" / "generated" / "mock_data.sql"

USER_COUNT = 1000
SHOP_COUNT = 5000
VOUCHER_COUNT = 20
SECKILL_COUNT = 10

PLACEHOLDER_IMAGE = "https://dummyimage.com/600x400/111827/ffffff.png&text=hm-dianping"
AREAS = ["WestLake", "Binjiang", "Gongshu", "Shangcheng", "Yuhang", "Xiaoshan", "Qianjiang", "Canal", "Hubin", "Chengxi"]
SHOP_SUFFIXES = ["Hotpot", "Coffee", "BBQ", "Noodles", "Dessert", "Fitness", "KTV", "Hair", "Bar", "KidsPark"]
OPEN_HOURS = ["09:00-21:00", "10:00-22:00", "11:00-23:00", "00:00-24:00"]


def sql_escape(value: object) -> str:
    if value is None:
        return "NULL"
    text = str(value)
    return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'"


def values_sql(rows: list[list[object]], chunk_size: int = 500) -> Iterable[str]:
    for i in range(0, len(rows), chunk_size):
        part = rows[i : i + chunk_size]
        yield ",\n".join("(" + ", ".join(map(str, row)) + ")" for row in part)


def now_str(offset_days: int = 0) -> str:
    return (datetime.now() + timedelta(days=offset_days)).strftime("%Y-%m-%d %H:%M:%S")


def generate_users() -> list[str]:
    now = sql_escape(now_str())
    rows: list[list[object]] = []
    for i in range(1, USER_COUNT + 1):
        rows.append(
            [
                f"@user_base_id + {i}",
                sql_escape(f"139{80000000 + i:08d}"),
                sql_escape(""),
                sql_escape(f"MockUser{i:04d}"),
                sql_escape("" if i % 3 else f"/imgs/icons/mock-user-{i % 10}.png"),
                now,
                now,
            ]
        )
    return [
        "INSERT INTO `tb_user` (`id`, `phone`, `password`, `nick_name`, `icon`, `create_time`, `update_time`) VALUES\n"
        + chunk
        + ";"
        for chunk in values_sql(rows)
    ]


def generate_shops() -> list[str]:
    now = sql_escape(now_str())
    rows: list[list[object]] = []
    for i in range(1, SHOP_COUNT + 1):
        area = AREAS[i % len(AREAS)]
        suffix = SHOP_SUFFIXES[i % len(SHOP_SUFFIXES)]
        rows.append(
            [
                f"@shop_base_id + {i}",
                sql_escape(f"Test Shop {i:04d} {suffix}"),
                (i % 10) + 1,
                sql_escape(PLACEHOLDER_IMAGE),
                sql_escape(area),
                sql_escape(f"{area} Test Road No.{i}"),
                f"{120.10 + random.random() * 0.12:.6f}",
                f"{30.20 + random.random() * 0.18:.6f}",
                random.randint(20, 280),
                random.randint(1, 30000),
                random.randint(0, 12000),
                random.randint(35, 50),
                sql_escape(random.choice(OPEN_HOURS)),
                now,
                now,
            ]
        )
    return [
        "INSERT INTO `tb_shop` (`id`, `name`, `type_id`, `images`, `area`, `address`, `x`, `y`, `avg_price`, `sold`, `comments`, `score`, `open_hours`, `create_time`, `update_time`) VALUES\n"
        + chunk
        + ";"
        for chunk in values_sql(rows)
    ]


def generate_vouchers() -> list[str]:
    now = sql_escape(now_str())
    rows: list[list[object]] = []
    for i in range(1, VOUCHER_COUNT + 1):
        is_seckill = i <= SECKILL_COUNT
        actual_value = random.choice([1000, 2000, 3000, 5000, 8000])
        pay_value = int(actual_value * random.uniform(0.45, 0.85))
        rows.append(
            [
                f"@voucher_base_id + {i}",
                f"@shop_base_id + {((i - 1) % SHOP_COUNT) + 1}",
                sql_escape(("Seckill Voucher " if is_seckill else "Discount Voucher ") + f"{i:02d}"),
                sql_escape("Local demo data, valid every day"),
                sql_escape("No cash exchange; no stacking; dine-in only"),
                pay_value,
                actual_value,
                1 if is_seckill else 0,
                1,
                now,
                now,
            ]
        )
    return [
        "INSERT INTO `tb_voucher` (`id`, `shop_id`, `title`, `sub_title`, `rules`, `pay_value`, `actual_value`, `type`, `status`, `create_time`, `update_time`) VALUES\n"
        + chunk
        + ";"
        for chunk in values_sql(rows)
    ]


def generate_seckill_vouchers() -> list[str]:
    now = sql_escape(now_str())
    begin_time = sql_escape(now_str(-1))
    end_time = sql_escape(now_str(7))
    rows: list[list[object]] = []
    for i in range(1, SECKILL_COUNT + 1):
        rows.append(
            [
                f"@voucher_base_id + {i}",
                random.randint(50, 200),
                now,
                begin_time,
                end_time,
                now,
            ]
        )
    return [
        "INSERT INTO `tb_seckill_voucher` (`voucher_id`, `stock`, `create_time`, `begin_time`, `end_time`, `update_time`) VALUES\n"
        + chunk
        + ";"
        for chunk in values_sql(rows)
    ]


def build_sql() -> str:
    random.seed(20260407)
    lines = [
        "-- Generated by scripts/generate_test_data.py",
        "-- Import target: hm_dianping",
        "SET NAMES utf8mb4;",
        "SET @user_base_id := (SELECT COALESCE(MAX(id), 0) FROM `tb_user`);",
        "SET @shop_base_id := (SELECT COALESCE(MAX(id), 0) FROM `tb_shop`);",
        "SET @voucher_base_id := (SELECT COALESCE(MAX(id), 0) FROM `tb_voucher`);",
        "START TRANSACTION;",
        "",
        "-- 1000 mock users",
        *generate_users(),
        "",
        "-- 5000 mock shops",
        *generate_shops(),
        "",
        "-- 20 mock vouchers, first 10 are seckill vouchers",
        *generate_vouchers(),
        "",
        "-- 10 hot seckill voucher rows",
        *generate_seckill_vouchers(),
        "",
        "COMMIT;",
        "",
        "-- Suggested hot shops: 1, 2, 3",
        "-- Suggested cold shops: 100, 500, 999",
        "-- Suggested missing shop: 999999",
        "-- Suggested generated seckill voucher ids: @voucher_base_id + 1 through @voucher_base_id + 10",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate hm-dianping mock data SQL.")
    parser.add_argument("-o", "--output", default=str(DEFAULT_OUTPUT), help="Output SQL path.")
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(build_sql(), encoding="utf-8", newline="\n")
    print(f"Generated {output}")
    print(f"Users={USER_COUNT}, Shops={SHOP_COUNT}, Vouchers={VOUCHER_COUNT}, Seckill={SECKILL_COUNT}")


if __name__ == "__main__":
    main()
