import { useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import type { BarcodeParams } from '@/types';

export const useQRCode = () => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(async (params: BarcodeParams): Promise<string> => {
    if (!params.content.trim()) {
      setError('请输入内容');
      return '';
    }

    setLoading(true);
    setError('');

    try {
      const { content, format, size = 256, color = '#000000', bgColor = '#ffffff', margin = 4 } = params;
      
      const opts = {
        width: size,
        color: {
          dark: color,
          light: bgColor,
        },
        margin,
        typeNumber: format === 'QRCODE,M' ? 1 : undefined,
      };

      const qrDataUrl = await QRCode.toDataURL(content, opts);
      setDataUrl(qrDataUrl);
      return qrDataUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成二维码失败';
      setError(errorMsg);
      return '';
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCanvas = useCallback(async (params: BarcodeParams, canvas: HTMLCanvasElement): Promise<void> => {
    if (!params.content.trim()) {
      setError('请输入内容');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { content, format, size = 256, color = '#000000', bgColor = '#ffffff', margin = 4 } = params;
      
      const opts = {
        width: size,
        color: {
          dark: color,
          light: bgColor,
        },
        margin,
        typeNumber: format === 'QRCODE,M' ? 1 : undefined,
      };

      await QRCode.toCanvas(canvas, content, opts);
      const dataUrl = canvas.toDataURL('image/png');
      setDataUrl(dataUrl);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成二维码失败';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dataUrl,
    error,
    loading,
    canvasRef,
    generate,
    generateCanvas,
    setDataUrl,
    setError,
  };
};