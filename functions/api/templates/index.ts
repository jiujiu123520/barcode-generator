/**
 * 模板列表 API
 * GET /api/templates - 获取模板列表
 * POST /api/templates - 创建模板（需要登录）
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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  if (context.request.method === 'GET') {
    return handleGet(context);
  }

  if (context.request.method === 'POST') {
    return handlePost(context);
  }

  return errorResponse('方法不允许', 405);
}

async function handleGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const templateIds: string[] = await context.env.LABEL_KV.get('templates:list', 'json') || [];
    const templates: LabelTemplate[] = [];

    for (const templateId of templateIds) {
      const template = await context.env.LABEL_KV.get<LabelTemplate>(`template:${templateId}`, 'json');
      if (template) {
        templates.push(template);
      }
    }

    templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return jsonResponse(templates);
  } catch (e) {
    return errorResponse('获取模板列表失败', 500);
  }
}

async function handlePost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const userPayload = await extractUserFromRequest(context.request);

    if (!userPayload) {
      return errorResponse('未授权', 401);
    }

    const body = await context.request.json();
    const { name, width, height, backgroundColor, elements } = body;

    if (!name) {
      return errorResponse('模板名称不能为空');
    }

    if (width === undefined || height === undefined) {
      return errorResponse('模板宽度和高度不能为空');
    }

    const templateId = generateId();
    const now = new Date().toISOString();

    const template: LabelTemplate = {
      id: templateId,
      name,
      width,
      height,
      backgroundColor: backgroundColor || '#ffffff',
      elements: elements || [],
      createdAt: now,
      updatedAt: now,
    };

    await context.env.LABEL_KV.put(`template:${templateId}`, JSON.stringify(template));

    const templateIds: string[] = await context.env.LABEL_KV.get('templates:list', 'json') || [];
    templateIds.push(templateId);
    await context.env.LABEL_KV.put('templates:list', JSON.stringify(templateIds));

    return jsonResponse(template, 201);
  } catch (e) {
    return errorResponse('创建模板失败', 500);
  }
}
