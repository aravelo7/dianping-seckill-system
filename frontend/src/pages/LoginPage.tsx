import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login, sendCode } from '../api/auth';
import { isLoggedIn, setToken } from '../utils/auth';

interface LoginForm {
  phone: string;
  code: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginForm>();
  const [codeLoading, setCodeLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  if (isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  async function handleSendCode() {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      message.warning('请先输入手机号');
      return;
    }
    setCodeLoading(true);
    try {
      const res = await sendCode(phone);
      if (res.data.success) {
        message.success('验证码已发送，请查看后端日志');
      } else {
        message.error(res.data.errorMsg || '验证码发送失败');
      }
    } catch (e) {
      message.error('验证码发送失败，请检查后端服务');
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleLogin(values: LoginForm) {
    setLoginLoading(true);
    try {
      const res = await login(values);
      if (res.data.success && res.data.data) {
        setToken(res.data.data);
        message.success('登录成功');
        navigate('/', { replace: true });
      } else {
        message.error(res.data.errorMsg || '登录失败');
      }
    } catch (e) {
      message.error('登录失败，请检查后端服务');
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-copy">
        <div className="eyebrow">hm-dianping demo</div>
        <h1>本地生活点评平台演示系统</h1>
        <p>登录后可演示 JWT 鉴权、商铺缓存、秒杀限流和缓存监控面板。</p>
      </div>
      <Card className="login-card">
        <Typography.Title level={3}>验证码登录</Typography.Title>
        <Typography.Paragraph type="secondary">验证码会输出在 Spring Boot 后端日志中。</Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={handleLogin}>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '手机号不能为空' }]}>
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号，例如 13800138000" />
          </Form.Item>
          <Form.Item name="code" label="验证码" rules={[{ required: true, message: '验证码不能为空' }]}>
            <Input prefix={<LockOutlined />} placeholder="请输入后端日志中的验证码" />
          </Form.Item>
          <div className="login-actions">
            <Button onClick={handleSendCode} loading={codeLoading}>
              获取验证码
            </Button>
            <Button type="primary" htmlType="submit" loading={loginLoading}>
              登录
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
