import { useState, useCallback, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import type { BarcodeParams } from '@/types';

export const useBarcode = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback((params: BarcodeParams): void => {
    if (!params.content.trim()) {
      setError('请输入内容');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { content, format, width = 2, height = 100, color = '#000000', bgColor = '#ffffff', margin = 10 } = params;

      if (svgRef.current) {
        JsBarcode(svgRef.current, content, {
          format: format as JsBarcode.Format,
          width,
          height,
          color,
          background: bgColor,
          margin,
          displayValue: true,
        });
      }

      if (canvasRef.current) {
        JsBarcode(canvasRef.current, content, {
          format: format as JsBarcode.Format,
          width,
          height,
          color,
          background: bgColor,
          margin,
          displayValue: true,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成条形码失败';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSVGContent = useCallback((): string => {
    if (!svgRef.current) return '';
    return new XMLSerializer().serializeToString(svgRef.current);
  }, []);

  const getCanvasDataUrl = useCallback((): string => {
    if (!canvasRef.current) return '';
    return canvasRef.current.toDataURL('image/png');
  }, []);

  useEffect(() => {
    return () => {
      setError('');
      setLoading(false);
    };
  }, []);

  return {
    error,
    loading,
    svgRef,
    canvasRef,
    generate,
    getSVGContent,
    getCanvasDataUrl,
    setError,
  };
};