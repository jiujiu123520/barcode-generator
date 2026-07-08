import { useState, useEffect } from 'react';
import { Users, LayoutTemplate, CalendarClock, BarChart3, AlertCircle, TrendingUp } from 'lucide-react';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

interface StatsData {
  totalUsers: number;
  totalTemplates: number;
  todayGenerations: number;
  totalGenerations: number;
  dailyGenerations: { date: string; count: number }[];
  templateRanking: { id: string; name: string; count: number }[];
}

export default function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGet<StatsData>('/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const dailyData = stats?.dailyGenerations ?? [];
  const maxDaily = Math.max(1, ...dailyData.map((d) => d.count));
  const ranking = stats?.templateRanking ?? [];
  const maxRanking = Math.max(1, ...ranking.map((r) => r.count));

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-sm text-gray-500 mt-1">查看平台使用情况</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-5 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
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

  const overviewCards = [
    { label: '总用户数', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '总模板数', value: stats?.totalTemplates ?? 0, icon: LayoutTemplate, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: '今日生成', value: stats?.todayGenerations ?? 0, icon: CalendarClock, color: 'text-green-500', bg: 'bg-green-50' },
    { label: '总生成次数', value: stats?.totalGenerations ?? 0, icon: BarChart3, color: 'text-primary-500', bg: 'bg-primary-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
        <p className="text-sm text-gray-500 mt-1">查看平台使用情况，{user?.username || '管理员'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">最近7天生成趋势</h3>
        <p className="text-xs text-gray-400 mb-6">每日生成次数</p>
        {dailyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">暂无数据</p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3 h-48">
            {dailyData.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs text-gray-500 mb-1">{d.count}</span>
                <div
                  className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                  style={{
                    height: `${(d.count / maxDaily) * 100}%`,
                    minHeight: d.count > 0 ? '4px' : '0',
                  }}
                />
                <span className="text-xs text-gray-400 mt-2">{formatDate(d.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">模板使用排行</h3>
          <p className="text-xs text-gray-400 mt-0.5">按使用次数排序</p>
        </div>
        {ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">暂无数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模板名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用次数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">占比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ranking.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">#{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 mr-3 overflow-hidden">
                          <div
                            className="bg-primary-500 h-full rounded-full transition-all"
                            style={{ width: `${(r.count / maxRanking) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {Math.round((r.count / maxRanking) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
