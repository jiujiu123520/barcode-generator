/**
 * 获取统计数据 API
 * GET /api/stats
 * 仅管理员可访问
 */

import { extractUserFromRequest } from '../_utils/jwt';
import { jsonResponse, errorResponse, handleOptions } from '../_utils/response';

interface Env {
  LABEL_KV: KVNamespace;
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  if (context.request.method !== 'GET') {
    return errorResponse('方法不允许', 405);
  }

  try {
    const userPayload = await extractUserFromRequest(context.request);

    if (!userPayload) {
      return errorResponse('未授权', 401);
    }

    if (userPayload.role !== 'admin') {
      return errorResponse('没有权限', 403);
    }

    const totalGenerations = await context.env.LABEL_KV.get<number>('stats:total', 'json') || 0;

    const today = getDateString(0);
    const todayGenerations = await context.env.LABEL_KV.get<number>(`stats:daily:${today}`, 'json') || 0;

    const dailyGenerations: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDateString(i);
      const count = await context.env.LABEL_KV.get<number>(`stats:daily:${date}`, 'json') || 0;
      dailyGenerations.push({ date, count });
    }

    const templateIds: string[] = await context.env.LABEL_KV.get('templates:list', 'json') || [];
    const templateRanking: { id: string; name: string; count: number }[] = [];

    for (const templateId of templateIds) {
      const template = await context.env.LABEL_KV.get<{ id: string; name: string }>(`template:${templateId}`, 'json');
      const count = await context.env.LABEL_KV.get<number>(`stats:template:${templateId}`, 'json') || 0;
      templateRanking.push({
        id: templateId,
        name: template?.name || '未知模板',
        count,
      });
    }

    templateRanking.sort((a, b) => b.count - a.count);

    const totalUsers = (await context.env.LABEL_KV.get<string[]>('users:list', 'json') || []).length;
    const totalTemplates = templateIds.length;

    return jsonResponse({
      totalUsers,
      totalTemplates,
      todayGenerations,
      totalGenerations,
      dailyGenerations,
      templateRanking,
    });
  } catch (e) {
    return errorResponse('获取统计数据失败', 500);
  }
}
