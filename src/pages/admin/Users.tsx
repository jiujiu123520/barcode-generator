import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Trash2, X, AlertCircle, Loader2, Users as UsersIcon, User as UserIcon, Crown } from 'lucide-react';
import { apiGet, apiPut, apiDelete } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

// 用户项接口
interface UserItem {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt?: string;
  status?: 'active' | 'disabled';
}

export default function Users() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // 删除确认
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<UserItem[]>('/auth/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 搜索过滤
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const keyword = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(keyword) ||
        (u.role === 'admin' ? '管理员'.includes(keyword) : '普通用户'.includes(keyword))
    );
  }, [users, search]);

  // 修改用户角色
  const handleRoleChange = async (user: UserItem, newRole: 'admin' | 'user') => {
    if (newRole === user.role) return;
    try {
      await apiPut(`/auth/users/${user.id}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改角色失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await apiDelete(`/auth/users/${deleteUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败');
    } finally {
      setDeleting(false);
    }
  };

  // 格式化时间
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理平台用户和权限</p>
        </div>
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名或角色"
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        // 空数据状态
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <UsersIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">{search ? '未找到匹配的用户' : '暂无用户数据'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-primary-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {u.username}
                          {u.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-gray-400">（当前用户）</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as 'admin' | 'user')}
                          disabled={u.id === currentUser?.id}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === 'admin' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              管理员
                            </>
                          ) : (
                            '普通用户'
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          u.status === 'disabled' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {u.status === 'disabled' ? '已禁用' : '正常'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && u.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                          title="删除用户"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setDeleteUser(null)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">确认删除用户</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                确定要删除用户「<span className="font-medium text-gray-700">{deleteUser.username}</span>」吗？此操作不可撤销。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {deleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
