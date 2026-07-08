/**
 * 模板详情 API
 * GET /api/templates/[id] - 获取模板详情
 * PUT /api/templates/[id] - 更新模板（需要登录）
 * DELETE /api/templates/[id] - 删除模板（需要登录）
 */

import { extractUserFromRequest } from '../_utils/jwt';
import { jsonResponse, errorResponse, handleOptions } from '../_utils/response';

interface Env {
  LABEL_KV: KVNamespace;
}

interface LabelElement {
  id: string;
  type: 'text' | 'qrcode' | 'barcode' | 'image' | 'line' | 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  format?: string;
  color?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  lineColor?: string;
  displayValue?: boolean;
  textAlign?: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
}

interface Params {
  id: string;
}

export async function onRequest(context: { request: Request; env: Env; params: Params }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  const templateId = context.params.id;
  const template = await context.env.LABEL_KV.get<LabelTemplate>(`template:${templateId}`, 'json');

  if (context.request.method === 'GET') {
    if (!template) {
      return errorResponse('模板不存在', 404);
    }
    return jsonResponse(template);
  }

  const userPayload = await extractUserFromRequest(context.request);
  if (!userPayload) {
    return errorResponse('未授权', 401);
  }

  if (context.request.method === 'PUT') {
    if (!template) {
      return errorResponse('模板不存在', 404);
    }

    try {
      const body = await context.request.json();
      const { name, width, height, backgroundColor, elements } = body;

      if (name !== undefined) template.name = name;
      if (width !== undefined) template.width = width;
      if (height !== undefined) template.height = height;
      if (backgroundColor !== undefined) template.backgroundColor = backgroundColor;
      if (elements !== undefined) template.elements = elements;
      template.updatedAt = new Date().toISOString();

      await context.env.LABEL_KV.put(`template:${templateId}`, JSON.stringify(template));
      return jsonResponse(template);
    } catch (e) {
      return errorResponse('更新模板失败', 500);
    }
  }

  if (context.request.method === 'DELETE') {
    if (!template) {
      return errorResponse('模板不存在', 404);
    }

    try {
      await context.env.LABEL_KV.delete(`template:${templateId}`);

      const templateIds: string[] = await context.env.LABEL_KV.get('templates:list', 'json') || [];
      const updatedIds = templateIds.filter(id => id !== templateId);
      await context.env.LABEL_KV.put('templates:list', JSON.stringify(updatedIds));

      return jsonResponse({ message: '删除成功' });
    } catch (e) {
      return errorResponse('删除模板失败', 500);
    }
  }

  return errorResponse('方法不允许', 405);
}
