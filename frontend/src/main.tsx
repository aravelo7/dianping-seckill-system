import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgBase: '#0f172a',
          colorBgContainer: '#111827',
          colorBorder: '#1f2937',
          colorText: '#e5e7eb',
          colorTextSecondary: '#9ca3af',
          borderRadius: 12
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
