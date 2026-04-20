# 本地运行与演示说明

## 技术栈

Java 8 / Spring Boot / MyBatis-Plus / MySQL / Redis / JWT / RabbitMQ / Docker

## 环境启动

启动本地依赖：

```powershell
docker compose up -d mysql redis rabbitmq
```

启动后端：

```powershell
mvn spring-boot:run
```

启动前端演示端：

```powershell
cd frontend
npm install
npm run dev
```

前端默认地址：

```text
http://localhost:5173
```

默认连接信息：

```text
MySQL: 127.0.0.1:3307 / root / 123456 / hm_dianping
Redis: 127.0.0.1:6379
RabbitMQ: 127.0.0.1:5672
API: http://localhost:8081
RabbitMQ Console: http://localhost:15672 / guest / guest
```

## JWT 登录验证

发送验证码：

```powershell
$phone = "13800138000"
Invoke-RestMethod -Method Post "http://localhost:8081/user/code?phone=$phone"
```

从后端日志读取 6 位验证码后登录：

```powershell
$body = @{ phone = $phone; code = "日志中的6位验证码" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post "http://localhost:8081/user/login" -ContentType "application/json" -Body $body
$token = $login.data
```

验证当前用户：

```powershell
Invoke-RestMethod -Headers @{ Authorization = "Bearer $token" } "http://localhost:8081/user/me"
```

## 缓存监控验证

先清空统计，便于演示：

```powershell
Invoke-RestMethod -Method Post -Headers @{ Authorization = "Bearer $token" } "http://localhost:8081/admin/cache/metrics/reset"
```

连续访问商铺详情：

```powershell
Invoke-RestMethod "http://localhost:8081/shop/1"
Invoke-RestMethod "http://localhost:8081/shop/1"
Invoke-RestMethod "http://localhost:8081/shop/1"
```

访问不存在的商铺，观察空值缓存命中：

```powershell
Invoke-RestMethod "http://localhost:8081/shop/999999"
Invoke-RestMethod "http://localhost:8081/shop/999999"
```

查看缓存统计：

```powershell
Invoke-RestMethod -Headers @{ Authorization = "Bearer $token" } "http://localhost:8081/admin/cache/metrics"
Invoke-RestMethod -Headers @{ Authorization = "Bearer $token" } "http://localhost:8081/admin/cache/hotkeys"
```

浏览器演示页：

```text
http://localhost:8081/admin/cache-monitor.html
```

说明：监控接口默认只允许 `hmdp.admin.user-ids` 中的用户访问，默认值为 `1`。本地演示时可通过环境变量调整：

```powershell
$env:ADMIN_USER_IDS="1,2"
mvn spring-boot:run
```

## 秒杀限流验证

同一用户 5 秒内最多允许 3 次秒杀请求，第 4 次起触发用户级限流：

```powershell
1..5 | ForEach-Object {
  Invoke-RestMethod -Method Post -Headers @{ Authorization = "Bearer $token" } "http://localhost:8081/voucher-order/seckill/1"
}
```

预期用户级限流返回：

```text
请求过于频繁，请稍后再试
```

全局秒杀入口每秒最多允许 100 次请求进入业务链路，并发压测时超过阈值会返回：

```text
当前秒杀请求过多，请稍后重试
```

## 批量测试数据

生成本地 mock SQL：

```powershell
python scripts/generate_test_data.py
```

当前环境如果没有 Python，也可以直接使用仓库中已生成的：

```text
scripts/generated/mock_data.sql
```

导入 MySQL：

```powershell
docker exec -i dianping-mysql mysql -uroot -p123456 hm_dianping < scripts/generated/mock_data.sql
```

说明：

```text
mock_data.sql 会读取 tb_user、tb_shop、tb_voucher 当前最大 id，再向后追加数据，避免覆盖已有数据和主键冲突。
导入后可用商铺 1、2、3 做热点缓存测试，用 100、500、999 做冷门商铺测试，用 999999 做不存在商铺测试。
生成的秒杀券 id 为导入时 tb_voucher 当前最大 id + 1 到 + 10，可通过查询 tb_seckill_voucher 获取实际 voucher_id。
```

## 秒杀库存 Redis Key 检修

秒杀链路依赖 Redis 库存 key：

```text
seckill:stock:{voucherId}
```

若导入新的秒杀券测试数据，需要同步检查或修复 Redis 中的库存 key：

```powershell
node scripts/check_and_repair_seckill_stock.js --mode=check
node scripts/check_and_repair_seckill_stock.js --mode=repair
```

脚本会对比 MySQL `tb_seckill_voucher.stock` 与 Redis `seckill:stock:{voucherId}`，报告 `MISSING`、`INVALID`、`MISMATCH`、`ORPHAN`。`repair` 模式会把缺失、非法、不一致的 Redis 库存同步为 MySQL 库存，但不会删除孤儿 key。

## 缓存击穿压测与图表可视化

启动依赖、后端和前端：

```powershell
docker compose up -d mysql redis rabbitmq
mvn spring-boot:run
cd frontend
npm install
npm run dev
```

登录前端后进入：

```text
http://localhost:5173/cache-monitor
```

正常热点压测：

```text
shopId=15
requestCount=20 或 50
concurrency=10
不勾选“压测前清除缓存”
```

缓存击穿压测：

```text
shopId=15
requestCount=50 或 100
concurrency=10
勾选“压测前清除缓存”
点击“开始压测”
```

观察图表：

```text
命中 / 未命中 / DB 回源：观察 cacheHitCount、cacheMissCount、dbFallbackCount、nullCacheHitCount。
命中率：观察本轮访问后缓存命中率变化。
热点 key TopN：观察 cache:shop:15 是否进入热点排行。
压测结果图：观察总请求数、成功数、失败数、平均耗时和最大耗时。
```

## 数据库初始化说明

MySQL 容器首次创建数据卷时会自动执行：

```text
src/main/resources/db/hmdp.sql
```

如果 `dianping-mysql-data` 数据卷已经存在，MySQL 不会重复执行初始化脚本。修改 SQL 初始化脚本后，必须删除旧数据卷并重新启动：

```powershell
docker compose down -v
docker compose up -d mysql
docker logs dianping-mysql
```

日志中不应再出现 `ERROR 1067`，并应出现 `ready for connections`。

## Docker 启动完整服务

```powershell
docker compose up -d --build
```
