import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// 受保护路由：要求已登录且（可选）具备管理员权限
// - 未登录 → 跳转到登录页（携带来源地址）
// - 已登录但非管理员且 requireAdmin=true → 跳转到首页
// - 加载中 → 显示加载动画
interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ requireAdmin = false }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // 初始化阶段：从 localStorage 恢复登录状态时显示加载动画
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3 text-gray-500">
          <Spinner className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录：跳转到登录页，记录原始位置以便登录后返回
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // 需要管理员权限但当前用户非管理员
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 通过校验：渲染子路由
  return <Outlet />;
};

export default ProtectedRoute;
