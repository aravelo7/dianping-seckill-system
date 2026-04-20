import { Alert, Button, Descriptions, Space, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, UserDTO } from '../api/user';
import PageCard from '../components/PageCard';
import { clearToken, getToken } from '../utils/auth';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
        } else {
          setError(res.data.errorMsg || '获取用户信息失败');
        }
      })
      .catch(() => setError('获取用户信息失败，请重新登录'))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearToken();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  }

  return (
    <PageCard title="用户中心" description="用于验证 JWT 鉴权链路和 /user/me 接口。">
      {error && <Alert type="error" message={error} showIcon className="section-gap" />}
      <Spin spinning={loading}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户 ID">{user?.id || '-'}</Descriptions.Item>
          <Descriptions.Item label="昵称">{user?.nickName || '-'}</Descriptions.Item>
          <Descriptions.Item label="头像">{user?.icon || '-'}</Descriptions.Item>
          <Descriptions.Item label="Token 状态">{getToken() ? '已保存到 localStorage' : '不存在'}</Descriptions.Item>
        </Descriptions>
      </Spin>
      <Space className="section-gap">
        <Button danger onClick={logout}>退出登录</Button>
        <Typography.Text type="secondary">退出后会清除本地 token 并跳转登录页。</Typography.Text>
      </Space>
    </PageCard>
  );
}
