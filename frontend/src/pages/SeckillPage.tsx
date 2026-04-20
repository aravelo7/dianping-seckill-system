import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { seckillVoucher } from '../api/voucher';
import PageCard from '../components/PageCard';

interface SeckillForm {
  voucherId: string;
}

interface SeckillResult {
  success?: boolean;
  data?: unknown;
  errorMsg?: string;
}

export default function SeckillPage() {
  const [form] = Form.useForm<SeckillForm>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeckillResult | null>(null);

  async function submit(values: SeckillForm) {
    setLoading(true);
    try {
      const res = await seckillVoucher(values.voucherId || 1);
      setResult(res.data);
    } catch (e) {
      setResult({ success: false, errorMsg: '秒杀请求失败，请检查登录态或后端服务' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageCard title="秒杀演示" description="连续点击可观察一人一单与限流效果；限流失败会直接返回业务提示。">
      <Alert
        type="info"
        showIcon
        className="section-gap"
        message="同一用户 5 秒内最多请求 3 次，第 4 次起会触发用户级限流。"
      />
      <Form form={form} layout="inline" initialValues={{ voucherId: '1' }} onFinish={submit}>
        <Form.Item name="voucherId" label="优惠券 ID" rules={[{ required: true, message: '优惠券 ID 不能为空' }]}>
          <Input placeholder="例如 1" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" danger htmlType="submit" loading={loading}>立即秒杀</Button>
        </Form.Item>
      </Form>

      <div className="result-panel">
        <Typography.Title level={5}>接口返回</Typography.Title>
        <pre>{JSON.stringify(result || { message: '等待请求' }, null, 2)}</pre>
      </div>
    </PageCard>
  );
}
