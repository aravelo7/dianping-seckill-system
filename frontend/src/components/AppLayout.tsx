import {
  DashboardOutlined,
  LogoutOutlined,
  MonitorOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, UserDTO } from '../api/user';
import { clearToken } from '../utils/auth';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
        }
      })
      .catch(() => message.warning('当前登录态可能已失效'));
  }, []);

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

  function logout() {
    clearToken();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  }

  return (
    <Layout className="app-shell">
      <Sider width={232} className="app-sider">
        <div className="brand">
          <div className="brand-mark">DP</div>
          <div>
            <div className="brand-title">hm-dianping</div>
            <div className="brand-subtitle">本地生活演示端</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/', icon: <DashboardOutlined />, label: '控制台' },
            { key: '/profile', icon: <UserOutlined />, label: '用户中心' },
            { key: '/shop', icon: <ShopOutlined />, label: '商铺详情' },
            { key: '/seckill', icon: <ThunderboltOutlined />, label: '秒杀演示' },
            { key: '/cache-monitor', icon: <MonitorOutlined />, label: '缓存监控' }
          ]}
        />
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <Typography.Text className="header-title">系统控制台</Typography.Text>
          <Space>
            <Typography.Text className="header-user">
              {user ? `${user.nickName || '用户'} (#${user.id})` : '已登录'}
            </Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              退出登录
            </Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet context={{ user }} />
        </Content>
      </Layout>
    </Layout>
  );
}
