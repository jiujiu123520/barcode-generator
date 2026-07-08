// 统一 API 请求工具
// 封装 fetch，自动添加 Authorization header，自动处理 JSON，统一错误处理

// API 基础路径，对应 functions/api 下的云函数
const BASE_URL = '/api';

// 从本地存储获取认证 token
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// 统一请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 自动添加 Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // 处理错误响应
  if (!response.ok) {
    let errorMsg = `请求失败 (${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // 响应不是 JSON 格式，使用默认错误信息
    }
    throw new Error(errorMsg);
  }

  // 处理空响应
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

// GET 请求
export const apiGet = <T>(url: string, options?: RequestInit): Promise<T> => {
  return request<T>(url, { ...options, method: 'GET' });
};

// POST 请求
export const apiPost = <T>(url: string, data?: unknown, options?: RequestInit): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
};

// PUT 请求
export const apiPut = <T>(url: string, data?: unknown, options?: RequestInit): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
};

// DELETE 请求
export const apiDelete = <T>(url: string, options?: RequestInit): Promise<T> => {
  return request<T>(url, { ...options, method: 'DELETE' });
};

export default { apiGet, apiPost, apiPut, apiDelete };
