import { Alert, Button, Card, Checkbox, Col, Form, InputNumber, Progress, Row, Space, Statistic, Table, Typography, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  CacheMetricsDTO,
  CacheStressTestRequest,
  CacheStressTestResultDTO,
  getCacheMetrics,
  HotKeyDTO,
  resetCacheMetrics,
  runCacheStressTest
} from '../api/metrics';
import PageCard from '../components/PageCard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const columns: ColumnsType<HotKeyDTO> = [
  { title: '热点 Key', dataIndex: 'key', key: 'key' },
  { title: '访问次数', dataIndex: 'count', key: 'count', width: 140 }
];

export default function CacheMonitorPage() {
  const [metrics, setMetrics] = useState<CacheMetricsDTO | null>(null);
  const [stressResult, setStressResult] = useState<CacheStressTestResultDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [stressLoading, setStressLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm<CacheStressTestRequest>();

  async function loadMetrics() {
    setLoading(true);
    setError('');
    try {
      const res = await getCacheMetrics(10);
      if (res.data.success && res.data.data) {
        setMetrics(res.data.data);
      } else {
        setError(res.data.errorMsg || '监控接口访问失败');
      }
    } catch (e) {
      setError('监控接口访问失败，请检查权限或后端服务');
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError('');
    try {
      const res = await resetCacheMetrics();
      if (res.data.success) {
        message.success('缓存统计已清零');
        setStressResult(null);
        await loadMetrics();
      } else {
        setError(res.data.errorMsg || '清零失败');
      }
    } catch (e) {
      setError('清零失败，请检查权限或后端服务');
    } finally {
      setLoading(false);
    }
  }

  async function runStressTest(values: CacheStressTestRequest) {
    setStressLoading(true);
    setError('');
    try {
      const res = await runCacheStressTest(values);
      if (res.data.success && res.data.data) {
        setStressResult(res.data.data);
        message.success('缓存击穿压测完成');
        await loadMetrics();
      } else {
        setError(res.data.errorMsg || '压测失败');
      }
    } catch (e) {
      setError('压测失败，请检查权限或后端服务');
    } finally {
      setStressLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  const cacheBars = useMemo(() => [
    { name: '命中', value: metrics?.cacheHitCount || 0 },
    { name: '未命中', value: metrics?.cacheMissCount || 0 },
    { name: 'DB回源', value: metrics?.dbFallbackCount || 0 },
    { name: '空值命中', value: metrics?.nullCacheHitCount || 0 }
  ], [metrics]);

  const hotKeyBars = useMemo(() => (metrics?.topHotKeys || []).map((item) => ({
    key: item.key,
    count: item.count
  })), [metrics]);

  const stressBars = useMemo(() => {
    if (!stressResult) {
      return [];
    }
    return [
      { name: '总请求', value: stressResult.requestCount },
      { name: '成功', value: stressResult.successCount },
      { name: '失败', value: stressResult.failCount },
      { name: '平均耗时', value: Number(stressResult.avgResponseMs.toFixed(1)) },
      { name: '最大耗时', value: stressResult.maxResponseMs }
    ];
  }, [stressResult]);

  const stats = [
    ['总查询次数', metrics?.totalQueryCount],
    ['缓存命中次数', metrics?.cacheHitCount],
    ['缓存未命中次数', metrics?.cacheMissCount],
    ['空值缓存命中', metrics?.nullCacheHitCount],
    ['逻辑过期触发', metrics?.logicalExpireTriggerCount],
    ['缓存重建次数', metrics?.cacheRebuildCount],
    ['DB 回源次数', metrics?.dbFallbackCount],
    ['命中率', `${(((metrics?.hitRate || 0) * 100)).toFixed(2)}%`]
  ];

  return (
    <PageCard
      title="缓存监控"
      description="可先清空热点商铺缓存，再发起并发请求，观察缓存击穿场景下的 miss、回源和命中率变化。"
      extra={
        <Space>
          <Button onClick={loadMetrics} loading={loading}>刷新监控</Button>
          <Button danger onClick={reset} loading={loading}>清空统计</Button>
        </Space>
      }
    >
      {error && <Alert type="warning" message={error} showIcon className="section-gap" />}

      <Row gutter={[16, 16]} className="section-gap">
        {stats.map(([title, value]) => (
          <Col xs={24} sm={12} lg={6} key={title}>
            <Card className="metric-card">
              <Statistic title={title} value={value ?? 0} loading={loading} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="section-gap">
        <Col xs={24} lg={12}>
          <Card className="metric-card" title="命中 / 未命中 / DB 回源">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cacheBars}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="metric-card" title="命中率">
            <div className="hit-rate-panel">
              <Progress
                type="dashboard"
                percent={Number(((metrics?.hitRate || 0) * 100).toFixed(2))}
                strokeColor="#3b82f6"
                trailColor="#1f2937"
              />
              <Typography.Text type="secondary">
                命中率 = (缓存命中 + 空值缓存命中) / 总查询次数
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="metric-card section-gap" title="热点 key Top 10">
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={hotKeyBars}>
              <CartesianGrid stroke="#1f2937" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis type="category" dataKey="key" stroke="#9ca3af" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Table
          className="section-gap"
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={metrics?.topHotKeys || []}
          pagination={false}
        />
      </Card>

      <Card className="metric-card section-gap" title="缓存击穿压测">
        <Typography.Paragraph type="secondary">
          选择热点 shopId，勾选“压测前清除缓存”可模拟 cache:shop:shopId 被删除后，短时间并发访问的缓存击穿场景。
        </Typography.Paragraph>
        <Form
          form={form}
          layout="inline"
          initialValues={{ shopId: 15, requestCount: 50, concurrency: 10, clearCacheBeforeTest: true }}
          onFinish={runStressTest}
        >
          <Form.Item name="shopId" label="shopId" rules={[{ required: true, message: 'shopId 不能为空' }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="requestCount" label="请求总数" rules={[{ required: true, message: '请求总数不能为空' }]}>
            <InputNumber min={1} max={1000} />
          </Form.Item>
          <Form.Item name="concurrency" label="并发数" rules={[{ required: true, message: '并发数不能为空' }]}>
            <InputNumber min={1} max={100} />
          </Form.Item>
          <Form.Item name="clearCacheBeforeTest" valuePropName="checked">
            <Checkbox>压测前清除缓存</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={stressLoading}>开始压测</Button>
          </Form.Item>
        </Form>

        {stressResult && (
          <Row gutter={[16, 16]} className="section-gap">
            <Col xs={24} lg={10}>
              <Card className="metric-card" title="压测结果">
                <Row gutter={[16, 16]}>
                  <Col span={12}><Statistic title="总请求" value={stressResult.requestCount} /></Col>
                  <Col span={12}><Statistic title="成功数" value={stressResult.successCount} /></Col>
                  <Col span={12}><Statistic title="失败数" value={stressResult.failCount} /></Col>
                  <Col span={12}><Statistic title="总耗时(ms)" value={stressResult.totalDurationMs} /></Col>
                  <Col span={12}><Statistic title="平均耗时(ms)" value={stressResult.avgResponseMs.toFixed(1)} /></Col>
                  <Col span={12}><Statistic title="最大耗时(ms)" value={stressResult.maxResponseMs} /></Col>
                  <Col span={12}><Statistic title="最小耗时(ms)" value={stressResult.minResponseMs} /></Col>
                  <Col span={12}><Statistic title="本次命中率" value={`${((stressResult.cacheMetricsSnapshot.hitRate || 0) * 100).toFixed(2)}%`} /></Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card className="metric-card" title="压测结果图">
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stressBars}>
                      <CartesianGrid stroke="#1f2937" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Card>
    </PageCard>
  );
}
