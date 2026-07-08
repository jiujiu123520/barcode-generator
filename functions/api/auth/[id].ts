/**
 * 用户管理 API
 * PUT /api/auth/[id] - 更新用户
 * DELETE /api/auth/[id] - 删除用户
 * 仅管理员可访问
 */

import { extractUserFromRequest } from '../_utils/jwt';
import { hashPassword } from '../_utils/hash';
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

interface Params {
  id: string;
}

export async function onRequest(context: { request: Request; env: Env; params: Params }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  const userPayload = await extractUserFromRequest(context.request);

  if (!userPayload) {
    return errorResponse('未授权', 401);
  }

  if (userPayload.role !== 'admin') {
    return errorResponse('没有权限', 403);
  }

  const userId = context.params.id;
  const user = await context.env.LABEL_KV.get<User>(`user:${userId}`, 'json');

  if (!user) {
    return errorResponse('用户不存在', 404);
  }

  if (context.request.method === 'PUT') {
    try {
      const body = await context.request.json();
      const { username, password, role, status } = body;

      if (username !== undefined) {
        if (username.length < 3) {
          return errorResponse('用户名至少3位');
        }
        user.username = username;
      }

      if (password !== undefined) {
        if (password.length < 6) {
          return errorResponse('密码至少6位');
        }
        user.password = await hashPassword(password);
      }

      if (role !== undefined) {
        if (!['admin', 'user'].includes(role)) {
          return errorResponse('角色无效');
        }
        user.role = role;
      }

      if (status !== undefined) {
        if (!['active', 'disabled'].includes(status)) {
          return errorResponse('状态无效');
        }
        user.status = status;
      }

      await context.env.LABEL_KV.put(`user:${userId}`, JSON.stringify(user));

      const { password: _, ...userWithoutPassword } = user;
      return jsonResponse(userWithoutPassword);
    } catch (e) {
      return errorResponse('更新用户失败', 500);
    }
  }

  if (context.request.method === 'DELETE') {
    try {
      if (userPayload.sub === userId) {
        return errorResponse('不能删除自己');
      }

      await context.env.LABEL_KV.delete(`user:${userId}`);

      const userIds: string[] = await context.env.LABEL_KV.get('users:list', 'json') || [];
      const updatedIds = userIds.filter(id => id !== userId);
      await context.env.LABEL_KV.put('users:list', JSON.stringify(updatedIds));

      return jsonResponse({ message: '删除成功' });
    } catch (e) {
      return errorResponse('删除用户失败', 500);
    }
  }

  return errorResponse('方法不允许', 405);
}
