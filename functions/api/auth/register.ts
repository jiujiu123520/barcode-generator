/**
 * 用户注册 API
 * POST /api/auth/register
 * 第一个用户自动成为管理员
 */

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function initDefaultAdmin(env: Env): Promise<void> {
  const users: string[] = await env.LABEL_KV.get('users:list', 'json') || [];
  if (users.length === 0) {
    const adminId = generateId();
    const hashedPassword = await hashPassword('admin123');
    const admin: User = {
      id: adminId,
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await env.LABEL_KV.put(`user:${adminId}`, JSON.stringify(admin));
    await env.LABEL_KV.put('users:list', JSON.stringify([adminId]));
  }
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const options = handleOptions(context.request);
  if (options) return options;

  if (context.request.method !== 'POST') {
    return errorResponse('方法不允许', 405);
  }

  try {
    await initDefaultAdmin(context.env);

    const body = await context.request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空');
    }

    if (username.length < 3 || password.length < 6) {
      return errorResponse('用户名至少3位，密码至少6位');
    }

    const users: string[] = await context.env.LABEL_KV.get('users:list', 'json') || [];

    for (const userId of users) {
      const user = await context.env.LABEL_KV.get<User>(`user:${userId}`, 'json');
      if (user && user.username === username) {
        return errorResponse('用户名已存在');
      }
    }

    const userId = generateId();
    const hashedPassword = await hashPassword(password);
    const role = users.length === 0 ? 'admin' : 'user';

    const newUser: User = {
      id: userId,
      username,
      password: hashedPassword,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await context.env.LABEL_KV.put(`user:${userId}`, JSON.stringify(newUser));
    users.push(userId);
    await context.env.LABEL_KV.put('users:list', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;

    return jsonResponse(userWithoutPassword, 201);
  } catch (e) {
    return errorResponse('注册失败', 500);
  }
}
