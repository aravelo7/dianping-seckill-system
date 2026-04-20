import {
  MonitorOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardModule {
  title: string;
  path: string;
  icon: ReactNode;
  desc: string;
}

const modules: DashboardModule[] = [
  { title: '用户中心', path: '/profile', icon: <UserOutlined />, desc: '查看当前 JWT 用户信息' },
  { title: '商铺详情', path: '/shop', icon: <ShopOutlined />, desc: '查询商铺并观察缓存效果' },
  { title: '秒杀演示', path: '/seckill', icon: <ThunderboltOutlined />, desc: '验证限流与一人一单' },
  { title: '缓存监控', path: '/cache-monitor', icon: <MonitorOutlined />, desc: '查看命中率和热点 Key' }
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {modules.map((item) => (
          <Card
            key={item.path}
            hoverable
            className="dashboard-card"
            onClick={() => navigate(item.path)}
          >
            <div className="dashboard-card-icon">{item.icon}</div>
            <Typography.Title level={2}>{item.title}</Typography.Title>
            <Typography.Text>{item.desc}</Typography.Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
