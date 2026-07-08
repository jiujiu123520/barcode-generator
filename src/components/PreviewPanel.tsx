import { Eye, Download, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PreviewPanelProps {
  dataUrl: string;
  svgContent: string;
  loading: boolean;
  error: string;
  content: string;
  outputFormat: 'png' | 'svg';
  onOutputFormatChange: (format: 'png' | 'svg') => void;
  onDownload: () => void;
}

export const PreviewPanel = ({
  dataUrl,
  svgContent,
  loading,
  error,
  content,
  outputFormat,
  onOutputFormatChange,
  onDownload,
}: PreviewPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!dataUrl) return;
    
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'barcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-dark-800/50 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">预览</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOutputFormatChange('png')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
              outputFormat === 'png'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            PNG
          </button>
          <button
            onClick={() => onOutputFormatChange('svg')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
              outputFormat === 'svg'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            SVG
          </button>
        </div>
      </div>

      <div className="relative bg-white rounded-xl p-8 min-h-[300px] flex items-center justify-center mb-6">
        {loading ? (
          <div className="flex flex-col items-center space-x-2 animate-fade-in">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-dark-500 text-sm mt-2">生成中...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-x-2 animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-dark-600 text-sm mt-3 text-center max-w-xs">{error}</p>
          </div>
        ) : !dataUrl && !svgContent ? (
          <div className="flex flex-col items-center space-x-2 animate-fade-in">
            <div className="w-20 h-20 bg-dark-100 rounded-xl flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-dark-500 text-sm mt-4">输入内容后预览条码</p>
          </div>
        ) : (
          <div className="relative animate-slide-up">
            {outputFormat === 'png' ? (
              <img
                src={dataUrl}
                alt="Generated barcode"
                className="max-w-full max-h-[280px] object-contain"
                draggable={false}
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="max-w-full max-h-[280px] object-contain"
              />
            )}
          </div>
        )}
      </div>

      {content && (
        <div className="bg-dark-900/50 rounded-lg p-4 mb-6">
          <p className="text-xs text-dark-400 mb-1">编码内容</p>
          <p className="text-sm text-white font-mono break-all">{content}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleCopy}
          disabled={!dataUrl || loading}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            !dataUrl || loading
              ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
              : 'bg-dark-700 text-white hover:bg-dark-600'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-500" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>复制</span>
            </>
          )}
        </button>
        <button
          onClick={onDownload}
          disabled={!dataUrl && !svgContent || loading}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            !dataUrl && !svgContent || loading
              ? 'bg-primary-500/50 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>下载</span>
        </button>
      </div>
    </div>
  );
};