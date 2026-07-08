import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Loader2, Megaphone, Link as LinkIcon, HelpCircle, Save } from 'lucide-react';
import { apiGet, apiPut } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

// 公告
interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
}
// 导航链接
interface NavLink {
  id: string;
  label: string;
  url: string;
}
// 帮助文章
interface HelpArticle {
  id: string;
  title: string;
  content: string;
}
// 站点内容
interface SiteContent {
  announcements: Announcement[];
  navLinks: NavLink[];
  helpArticles: HelpArticle[];
}

// 内容项联合类型
type ContentItem = Announcement & NavLink & HelpArticle;

// 标签页类型
type TabId = keyof SiteContent;

// 标签页配置
const tabs: { id: TabId; label: string; singular: string; icon: typeof Megaphone }[] = [
  { id: 'announcements', label: '公告管理', singular: '公告', icon: Megaphone },
  { id: 'navLinks', label: '导航链接', singular: '导航链接', icon: LinkIcon },
  { id: 'helpArticles', label: '帮助文章', singular: '帮助文章', icon: HelpCircle },
];

const emptyContent: SiteContent = {
  announcements: [],
  navLinks: [],
  helpArticles: [],
};

// 生成新 id
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function Content() {
  const { user } = useAuth();
  const [content, setContent] = useState<SiteContent>(emptyContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('announcements');
  // 编辑项模态框
  const [editing, setEditing] = useState<{
    type: TabId;
    item: Partial<ContentItem>;
    id: string | null;
  } | null>(null);

  // 加载站点内容
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<SiteContent>('/content');
      setContent({ ...emptyContent, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载内容失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // 保存全部内容
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiPut('/content', content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 打开新建
  const handleAdd = (type: TabId) => {
    const emptyItem: Record<TabId, Partial<ContentItem>> = {
      announcements: { title: '', content: '', active: true },
      navLinks: { label: '', url: '' },
      helpArticles: { title: '', content: '' },
    };
    setEditing({ type, item: emptyItem[type], id: null });
  };

  // 打开编辑
  const handleEdit = (type: TabId, item: ContentItem) => {
    setEditing({ type, item: { ...item }, id: item.id });
  };

  // 提交编辑（更新本地状态，统一通过保存按钮提交后端）
  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { type, item, id } = editing;
    setContent((prev) => {
      const list = [...(prev[type] as ContentItem[])];
      if (id) {
        const idx = list.findIndex((x) => x.id === id);
        if (idx >= 0) list[idx] = { ...list[idx], ...item } as ContentItem;
      } else {
        list.push({ ...item, id: genId() } as ContentItem);
      }
      return { ...prev, [type]: list };
    });
    setEditing(null);
  };

  // 删除项
  const handleDelete = (type: TabId, id: string) => {
    setContent((prev) => ({
      ...prev,
      [type]: (prev[type] as ContentItem[]).filter((x) => x.id !== id),
    }));
  };

  const currentList = content[activeTab] as ContentItem[];
  const activeTabConfig = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理站点公告、导航和帮助文章 · {user?.username || '管理员'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          保存全部
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* 标签页切换 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                    <span className="ml-2 text-xs text-gray-400">{content[tab.id].length}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 列表区域 */}
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => handleAdd(activeTab)}
                className="inline-flex items-center px-3 py-1.5 border border-primary-300 text-primary-500 text-sm font-medium rounded-md hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加{activeTabConfig.singular}
              </button>
            </div>

            {currentList.length === 0 ? (
              // 空数据状态
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
                <activeTabConfig.icon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">暂无内容，点击「添加」创建</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      {activeTab === 'announcements' && (
                        <>
                          <div className="flex items-center mb-1">
                            <span className="text-sm font-medium text-gray-900">{item.title}</span>
                            <span
                              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {item.active ? '启用中' : '已停用'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                        </>
                      )}
                      {activeTab === 'navLinks' && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-3">{item.label}</span>
                          <span className="text-sm text-primary-500 truncate">{item.url}</span>
                        </div>
                      )}
                      {activeTab === 'helpArticles' && (
                        <>
                          <p className="text-sm font-medium text-gray-900 mb-1">{item.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleEdit(activeTab, item)}
                        className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activeTab, item.id)}
                        className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 编辑模态框 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setEditing(null)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing.id ? '编辑' : '新建'}
                {tabs.find((t) => t.id === editing.type)?.singular}
              </h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              {editing.type === 'navLinks' ? (
                <>
                  <div>
                    <label className="label-text">链接文本</label>
                    <input
                      type="text"
                      value={editing.item.label || ''}
                      onChange={(e) => setEditing({ ...editing, item: { ...editing.item, label: e.target.value } })}
                      className="input-field"
                      placeholder="如：标签模板"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">链接地址</label>
                    <input
                      type="text"
                      value={editing.item.url || ''}
                      onChange={(e) => setEditing({ ...editing, item: { ...editing.item, url: e.target.value } })}
                      className="input-field"
                      placeholder="如：/templates"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label-text">标题</label>
                    <input
                      type="text"
                      value={editing.item.title || ''}
                      onChange={(e) => setEditing({ ...editing, item: { ...editing.item, title: e.target.value } })}
                      className="input-field"
                      placeholder="请输入标题"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">内容</label>
                    <textarea
                      value={editing.item.content || ''}
                      onChange={(e) => setEditing({ ...editing, item: { ...editing.item, content: e.target.value } })}
                      className="input-field resize-none"
                      rows={5}
                      placeholder="请输入内容"
                      required
                    />
                  </div>
                  {editing.type === 'announcements' && (
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editing.item.active !== false}
                        onChange={(e) => setEditing({ ...editing, item: { ...editing.item, active: e.target.checked } })}
                        className="mr-2"
                      />
                      启用此公告
                    </label>
                  )}
                </>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
