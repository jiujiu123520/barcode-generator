import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Loader2, LayoutTemplate } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import type { LabelTemplate } from '@/types';

// 后台模板类型，扩展创建时间字段
interface AdminTemplate extends LabelTemplate {
  createdAt?: string;
}

// 模板表单数据
interface TemplateForm {
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
}

const emptyForm: TemplateForm = {
  name: '',
  width: 100,
  height: 60,
  backgroundColor: '#ffffff',
};

// 每页显示数量
const PAGE_SIZE = 10;

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载模板列表
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<AdminTemplate[]>('/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 打开新建模态框
  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  // 打开编辑模态框
  const handleOpenEdit = (tpl: AdminTemplate) => {
    setForm({
      name: tpl.name,
      width: tpl.width,
      height: tpl.height,
      backgroundColor: tpl.backgroundColor || '#ffffff',
    });
    setEditingId(tpl.id);
    setModalOpen(true);
  };

  // 提交表单（新建/编辑）
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, elements: [] };
      if (editingId) {
        await apiPut(`/templates/${editingId}`, payload);
      } else {
        await apiPost('/templates', payload);
      }
      setModalOpen(false);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiDelete(`/templates/${deleteId}`);
      setDeleteId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(templates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTemplates = templates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 格式化时间
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理所有标签模板 · {user?.username || '管理员'}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          新建模板
        </button>
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
      ) : templates.length === 0 ? (
        // 空数据状态
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <LayoutTemplate className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">暂无模板数据</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            创建第一个模板
          </button>
        </div>
      ) : (
        <>
          {/* 模板表格 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">元素数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagedTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tpl.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tpl.width} × {tpl.height} mm</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tpl.elements?.length ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(tpl.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(tpl)}
                            className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(tpl.id)}
                            className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                共 {templates.length} 条，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 新建/编辑模态框 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setModalOpen(false)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? '编辑模板' : '新建模板'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label-text">模板名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="请输入模板名称"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">宽度 (mm)</label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="label-text">高度 (mm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min={1}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label-text">背景色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={form.backgroundColor}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="w-12 h-9 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={form.backgroundColor}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="flex-1 input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingId ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setDeleteId(null)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">确定要删除这个模板吗？此操作不可撤销。</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteId(null)}
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
