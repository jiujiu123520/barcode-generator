import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, ArrowLeft, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// 管理员登录页：红色主题，居中卡片式登录表单
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 提交登录表单
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      // 登录成功后跳转到仪表盘
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 顶部 Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">多零标签管理后台</h1>
          <p className="mt-1 text-sm text-gray-500">请使用管理员账号登录</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className="label-text">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="label-text">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 返回首页链接 */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <Link
              to="/"
              className="flex items-center justify-center space-x-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} 多零标签 · 版权所有
        </p>
      </div>
    </div>
  );
};

export default Login;
