import { useState, useEffect } from 'react';
import { Users, LayoutTemplate, CalendarClock, BarChart3, AlertCircle } from 'lucide-react';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

interface StatsData {
  totalUsers: number;
  totalTemplates: number;
  todayGenerations: number;
  totalGenerations: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const statsData = await apiGet<StatsData>('/stats');
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，{user?.username || '管理员'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4" />
              <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-primary-500 mb-4" />
        <p className="text-gray-700 font-medium mb-1">加载失败</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  const cards = [
    { label: '总用户数', value: stats?.totalUsers ?? 0, icon: Users, desc: '注册用户总数' },
    { label: '总模板数', value: stats?.totalTemplates ?? 0, icon: LayoutTemplate, desc: '已创建的模板' },
    { label: '今日生成次数', value: stats?.todayGenerations ?? 0, icon: CalendarClock, desc: '今日生成记录' },
    { label: '总生成次数', value: stats?.totalGenerations ?? 0, icon: BarChart3, desc: '累计生成次数' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，{user?.username || '管理员'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
