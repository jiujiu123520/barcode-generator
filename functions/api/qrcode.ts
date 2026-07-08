import QRCode from 'qrcode';

export interface Env {
}

export default async function handler(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { content, format = 'QRCODE', size = 256, color = '#000000', bgColor = '#ffffff', margin = 4 } = body;

    if (!content) {
      return new Response(JSON.stringify({ success: false, error: '请输入内容' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const opts = {
      width: size,
      color: {
        dark: color,
        light: bgColor,
      },
      margin,
    };

    const dataUrl = await QRCode.toDataURL(content, opts);
    
    return new Response(JSON.stringify({ success: true, data: dataUrl, format: 'png' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '生成二维码失败';
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}