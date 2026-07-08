/**
 * 获取用户列表 API
 * GET /api/auth/users
 * 仅管理员可访问
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
  status: 'active' | 'disabled';
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

    if (userPayload.role !== 'admin') {
      return errorResponse('没有权限', 403);
    }

    const userIds: string[] = await context.env.LABEL_KV.get('users:list', 'json') || [];
    const users: Omit<User, 'password'>[] = [];

    for (const userId of userIds) {
      const user = await context.env.LABEL_KV.get<User>(`user:${userId}`, 'json');
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }

    return jsonResponse(users);
  } catch (e) {
    return errorResponse('获取用户列表失败', 500);
  }
}
