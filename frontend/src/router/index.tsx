import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import CacheMonitorPage from '../pages/CacheMonitorPage';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import SeckillPage from '../pages/SeckillPage';
import ShopPage from '../pages/ShopPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/shop', element: <ShopPage /> },
          { path: '/seckill', element: <SeckillPage /> },
          { path: '/cache-monitor', element: <CacheMonitorPage /> }
        ]
      }
    ]
  }
]);
