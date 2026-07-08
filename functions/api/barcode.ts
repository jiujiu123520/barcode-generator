import JsBarcode from 'jsbarcode';

export interface Env {
}

export default async function handler(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { content, format = 'CODE128', width = 2, height = 100, color = '#000000', bgColor = '#ffffff', margin = 10 } = body;

    if (!content) {
      return new Response(JSON.stringify({ success: false, error: '请输入内容' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const canvas = new OffscreenCanvas(500, 200);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return new Response(JSON.stringify({ success: false, error: '无法创建画布' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    JsBarcode(canvas, content, {
      format: format as JsBarcode.Format,
      width,
      height,
      color,
      background: bgColor,
      margin,
      displayValue: true,
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(new Response(JSON.stringify({ success: true, data: dataUrl, format: 'png' }), {
          headers: { 'Content-Type': 'application/json' },
        }));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '生成条形码失败';
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}