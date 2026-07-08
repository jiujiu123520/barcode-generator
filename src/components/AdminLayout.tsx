import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutTemplate,
  Users,
  BarChart3,
  FileText,
  QrCode,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// 左侧导航项配置
const navItems = [
  { to: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/admin/templates', label: '模板管理', icon: LayoutTemplate },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/stats', label: '数据统计', icon: BarChart3 },
  { to: '/admin/content', label: '内容管理', icon: FileText },
];

// 后台管理布局：左侧导航 + 顶栏 + Outlet 子路由渲染
const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 退出登录
  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  // 侧边栏导航内容
  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo 区 */}
      <div className="h-16 flex items-center justify-center bg-red-600">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-base">多零标签</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 返回前台链接 */}
      <div className="p-3 border-t border-gray-200">
        <Link
          to="/"
          className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>返回前台</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端左侧导航 */}
      <aside className="hidden md:block w-60 bg-white border-r border-gray-200 flex-shrink-0">
        {Sidebar}
      </aside>

      {/* 移动端抽屉式导航 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-60 bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      {/* 主区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="h-16 bg-red-500 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white hover:bg-white/10 p-1.5 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-bold text-base md:text-lg">
              多零标签管理后台
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* 管理员信息 */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium leading-tight">
                  {user?.username || '管理员'}
                </p>
                <p className="text-white/70 text-xs leading-tight">
                  {user?.role === 'admin' ? '超级管理员' : '普通用户'}
                </p>
              </div>
            </div>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出登录</span>
            </button>
          </div>
        </header>

        {/* 子路由内容 */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* 右下角返回前台链接（桌面端浮动） */}
      <Link
        to="/"
        className="hidden lg:flex fixed bottom-6 right-6 items-center space-x-1.5 px-4 py-2 bg-white shadow-lg border border-gray-200 rounded-full text-sm text-gray-600 hover:text-red-500 hover:border-red-200 transition-colors z-40"
      >
        <ExternalLink className="w-4 h-4" />
        <span>返回前台</span>
      </Link>
    </div>
  );
};

export default AdminLayout;
