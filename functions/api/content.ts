/**
 * 站点内容 API
 * GET /api/content - 获取站点内容
 * PUT /api/content - 更新站点内容（仅管理员）
 */

import { extractUserFromRequest } from '../_utils/jwt';
import { jsonResponse, errorResponse, handleOptions } from '../_utils/response';

interface Env {
  LABEL_KV: KVNamespace;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
}

interface NavLink {
  id: string;
  label: string;
  url: string;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
}

interface SiteContent {
  announcements: Announcement[];
  navLinks: NavLink[];
  helpArticles: HelpArticle[];
  updatedAt: string;
}

const DEFAULT_CONTENT: SiteContent = {
  announcements: [
    {
      id: 'welcome',
      title: '欢迎使用多零标签',
      content: '这是一个强大的在线标签生成工具，支持条形码和二维码。',
      active: true,
    },
  ],
  navLinks: [
    { id: 'home', label: '首页', url: '/' },
    { id: 'templates', label: '标签模板', url: '/templates' },
  ],
  helpArticles: [
    {
      id: 'getting-started',
      title: '快速开始',
      content: '选择一个模板，编辑内容，然后下载或打印标签。',
    },
  ],
  updatedAt: new Date().toISOString(),
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  if (context.request.method === 'GET') {
    return handleGet(context);
  }

  if (context.request.method === 'PUT') {
    return handlePut(context);
  }

  return errorResponse('方法不允许', 405);
}

async function handleGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    let content = await context.env.LABEL_KV.get<SiteContent>('site:content', 'json');

    if (!content) {
      content = DEFAULT_CONTENT;
      await context.env.LABEL_KV.put('site:content', JSON.stringify(content));
    }

    return jsonResponse(content);
  } catch (e) {
    return errorResponse('获取内容失败', 500);
  }
}

async function handlePut(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const userPayload = await extractUserFromRequest(context.request);

    if (!userPayload) {
      return errorResponse('未授权', 401);
    }

    if (userPayload.role !== 'admin') {
      return errorResponse('没有权限', 403);
    }

    const body = await context.request.json();
    const { announcements, navLinks, helpArticles } = body;

    let content = await context.env.LABEL_KV.get<SiteContent>('site:content', 'json') || { ...DEFAULT_CONTENT };

    if (announcements !== undefined) content.announcements = announcements;
    if (navLinks !== undefined) content.navLinks = navLinks;
    if (helpArticles !== undefined) content.helpArticles = helpArticles;
    content.updatedAt = new Date().toISOString();

    await context.env.LABEL_KV.put('site:content', JSON.stringify(content));

    return jsonResponse(content);
  } catch (e) {
    return errorResponse('更新内容失败', 500);
  }
}
