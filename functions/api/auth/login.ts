/**
 * 用户登录 API
 * POST /api/auth/login
 */

import { sign } from '../_utils/jwt';
import { verifyPassword } from '../_utils/hash';
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

  if (context.request.method !== 'POST') {
    return errorResponse('方法不允许', 405);
  }

  try {
    const body = await context.request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    const users: string[] = await context.env.LABEL_KV.get('users:list', 'json') || [];

    let foundUser: User | null = null;
    for (const userId of users) {
      const user = await context.env.LABEL_KV.get<User>(`user:${userId}`, 'json');
      if (user && user.username === username) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return errorResponse('用户名或密码错误', 401);
    }

    const isValid = await verifyPassword(password, foundUser.password);
    if (!isValid) {
      return errorResponse('用户名或密码错误', 401);
    }

    if (foundUser.status === 'disabled') {
      return errorResponse('账号已被禁用', 403);
    }

    const token = await sign({
      sub: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
    });

    const { password: _, ...userWithoutPassword } = foundUser;

    return jsonResponse({
      token,
      user: userWithoutPassword,
    });
  } catch (e) {
    return errorResponse('登录失败', 500);
  }
}
