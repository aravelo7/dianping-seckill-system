import { Alert, Button, Descriptions, Form, Input, Space, Spin, Typography, message } from 'antd';
import { useState } from 'react';
import { getShop, ShopDTO } from '../api/shop';
import PageCard from '../components/PageCard';

interface ShopForm {
  shopId: string;
}

export default function ShopPage() {
  const [form] = Form.useForm<ShopForm>();
  const [shop, setShop] = useState<ShopDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function queryShop(values: ShopForm) {
    setLoading(true);
    setError('');
    try {
      const res = await getShop(values.shopId || 1);
      if (res.data.success && res.data.data) {
        setShop(res.data.data);
        message.success('商铺查询成功');
      } else {
        setShop(null);
        setError(res.data.errorMsg || '商铺不存在');
      }
    } catch (e) {
      setError('商铺查询失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageCard title="商铺详情" description="默认查询 shopId=1，可重复点击验证缓存命中与热点 key 统计。">
      <Form form={form} layout="inline" initialValues={{ shopId: '1' }} onFinish={queryShop}>
        <Form.Item name="shopId" label="商铺 ID" rules={[{ required: true, message: '商铺 ID 不能为空' }]}>
          <Input placeholder="例如 1" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>查询商铺</Button>
        </Form.Item>
      </Form>

      {error && <Alert type="warning" message={error} showIcon className="section-gap" />}

      <Spin spinning={loading}>
        {shop ? (
          <Descriptions bordered column={1} className="section-gap">
            <Descriptions.Item label="ID">{shop.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{shop.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="类型">{shop.typeId || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{shop.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="图片">{shop.images || '-'}</Descriptions.Item>
            <Descriptions.Item label="评分">{shop.score || '-'}</Descriptions.Item>
            <Descriptions.Item label="评论数">{shop.comments || '-'}</Descriptions.Item>
            <Descriptions.Item label="均价">{shop.avgPrice || '-'}</Descriptions.Item>
            <Descriptions.Item label="营业时间">{shop.openHours || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Space direction="vertical" className="empty-state">
            <Typography.Text type="secondary">暂无商铺数据，请点击查询。</Typography.Text>
          </Space>
        )}
      </Spin>
    </PageCard>
  );
}
