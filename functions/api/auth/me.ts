/**
 * 获取当前用户信息 API
 * GET /api/auth/me
 */

import { extractUserFromRequest } from '../_utils/jwt';
import { jsonResponse, errorResponse, handleOptions } from '../_utils/response';

interface Env {
  LABEL_KV: KVNamespace;
}

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
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

    const user = await context.env.LABEL_KV.get<User>(`user:${userPayload.sub}`, 'json');

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    const { password: _, ...userWithoutPassword } = user;

    return jsonResponse(userWithoutPassword);
  } catch (e) {
    return errorResponse('获取用户信息失败', 500);
  }
}
