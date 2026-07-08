/**
 * 记录统计 API
 * POST /api/stats/record
 * 记录生成统计数据
 */

import { jsonResponse, errorResponse, handleOptions } from '../_utils/response';

interface Env {
  LABEL_KV: KVNamespace;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  if (context.request.method !== 'POST') {
    return errorResponse('方法不允许', 405);
  }

  try {
    const body = await context.request.json();
    const { templateId } = body;

    const today = getTodayDate();

    const total = await context.env.LABEL_KV.get<number>('stats:total', 'json') || 0;
    await context.env.LABEL_KV.put('stats:total', JSON.stringify(total + 1));

    const dailyKey = `stats:daily:${today}`;
    const daily = await context.env.LABEL_KV.get<number>(dailyKey, 'json') || 0;
    await context.env.LABEL_KV.put(dailyKey, JSON.stringify(daily + 1));

    if (templateId) {
      const templateKey = `stats:template:${templateId}`;
      const templateStats = await context.env.LABEL_KV.get<number>(templateKey, 'json') || 0;
      await context.env.LABEL_KV.put(templateKey, JSON.stringify(templateStats + 1));
    }

    return jsonResponse({ message: '统计记录成功' });
  } catch (e) {
    return errorResponse('记录统计失败', 500);
  }
}
