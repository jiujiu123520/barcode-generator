import { Upload, FileText, X, Plus, Download, Loader2, Check } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import type { BarcodeParams, BatchItem, BarcodeFormat } from '@/types';

interface BatchImportProps {
  isQRCode: boolean;
  formats: BarcodeFormat[];
  params: BarcodeParams;
  onParamsChange: (params: Partial<BarcodeParams>) => void;
}

export const BatchImport = ({ isQRCode, formats, params, onParamsChange }: BatchImportProps) => {
  const [activeTab, setActiveTab] = useState<'file' | 'manual'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<{ content: string; dataUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);
        const csvValues = lines.flatMap(line => 
          line.split(/[,;\t]/).map(v => v.trim().replace(/^["']|["']$/g, '')).filter(v => v)
        );
        const uniqueValues = [...new Set(csvValues)];
        
        setItems(uniqueValues.map((content, index) => ({
          id: `item-${index}`,
          content,
          status: 'pending' as const,
        })));
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const handleManualParse = useCallback(() => {
    const lines = manualInput.split('\n').map(l => l.trim()).filter(l => l);
    const uniqueLines = [...new Set(lines)];
    
    setItems(uniqueLines.map((content, index) => ({
      id: `item-${index}`,
      content,
      status: 'pending' as const,
    })));
  }, [manualInput]);

  const generateBatch = useCallback(async () => {
    if (items.length === 0) return;
    
    setGenerating(true);
    const results: { content: string; dataUrl: string }[] = [];

    for (const item of items) {
      try {
        if (isQRCode) {
          const qrDataUrl = await QRCode.toDataURL(item.content, {
            width: params.size || 256,
            color: {
              dark: params.color || '#000000',
              light: params.bgColor || '#ffffff',
            },
            margin: params.margin || 4,
          });
          results.push({ content: item.content, dataUrl: qrDataUrl });
        } else {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, item.content, {
            format: params.format as JsBarcode.Format,
            width: params.width || 2,
            height: params.height || 100,
            color: params.color || '#000000',
            background: params.bgColor || '#ffffff',
            margin: params.margin || 10,
            displayValue: true,
          });
          results.push({ content: item.content, dataUrl: canvas.toDataURL('image/png') });
        }
      } catch {
        continue;
      }
    }

    setGeneratedItems(results);
    setGenerating(false);
  }, [items, isQRCode, params]);

  const handleDownloadAll = useCallback(() => {
    generatedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.dataUrl;
        link.download = `${item.content}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 100);
    });
  }, [generatedItems]);

  const handleClear = useCallback(() => {
    setFile(null);
    setItems([]);
    setManualInput('');
    setGeneratedItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="bg-dark-800/50 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">批量生成</h2>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-dark-400 hover:text-white hover:bg-dark-700 rounded-md transition-all duration-200"
          >
            <X className="w-4 h-4" />
            <span>清空</span>
          </button>
        )}
      </div>

      <div className="flex space-x-2 mb-6 bg-dark-900/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>文件导入</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
            activeTab === 'manual'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>手动输入</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-dark-300 mb-2">编码格式</label>
        <select
          value={params.format}
          onChange={(e) => onParamsChange({ format: e.target.value })}
          className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {formats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      {activeTab === 'file' ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            file
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-600 hover:border-primary-500 hover:bg-dark-700/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-dark-400 text-sm">{items.length} 条数据</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-dark-700 rounded-xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-dark-400" />
              </div>
              <p className="text-white font-medium">上传 CSV 或 TXT 文件</p>
              <p className="text-dark-400 text-sm">每行一条数据，或使用逗号/分号分隔</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="每行输入一条数据...&#10;&#10;示例：&#10;product001&#10;product002&#10;product003"
            className="w-full h-40 px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleManualParse}
            disabled={!manualInput.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 disabled:bg-dark-800 disabled:text-dark-500 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>解析数据</span>
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-dark-300">解析结果 ({items.length} 条)</p>
          </div>
          <div className="max-h-40 overflow-y-auto bg-dark-900/50 rounded-lg p-3">
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={item.id} className="flex items-center space-x-2 text-sm text-dark-300">
                  <span className="w-6 h-6 bg-dark-700 rounded flex items-center justify-center text-xs text-dark-400">
                    {index + 1}
                  </span>
                  <span className="truncate flex-1">{item.content}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 flex space-x-3">
        <button
          onClick={generateBatch}
          disabled={items.length === 0 || generating}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            items.length === 0 || generating
              ? 'bg-primary-500/50 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>批量生成</span>
            </>
          )}
        </button>
      </div>

      {generatedItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-dark-300">生成结果 ({generatedItems.length} 条)</p>
            <button
              onClick={handleDownloadAll}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>下载全部</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {generatedItems.map((item, index) => (
              <div key={index} className="bg-dark-900 rounded-lg p-4">
                <img
                  src={item.dataUrl}
                  alt={item.content}
                  className="w-full h-auto max-h-32 object-contain mb-2"
                />
                <p className="text-xs text-dark-400 truncate">{item.content}</p>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = item.dataUrl;
                    link.download = `${item.content}.png`;
                    link.click();
                  }}
                  className="mt-2 w-full flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded hover:text-white hover:bg-dark-600 transition-all duration-200"
                >
                  <Check className="w-3 h-3" />
                  <span>下载</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};