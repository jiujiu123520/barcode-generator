import { useState, useEffect, useCallback, useRef } from 'react';
import { Type, QrCode, Barcode, Image, Minus, Star, Square, Circle, Layers } from 'lucide-react';
import { Header } from '@/components/Header';
import { useQRCode } from '@/hooks/useQRCode';
import { useBarcode } from '@/hooks/useBarcode';
import { qrCodeFormats } from '@/utils/qrCodeFormats';
import { barcodeFormats } from '@/utils/barcodeFormats';
import { generateFilename } from '@/utils/exportUtils';
import { presetTemplates } from '@/data/templates';
import type { BarcodeParams, LabelTemplate, LabelElement } from '@/types';

interface ToolbarItem {
  id: string;
  icon: typeof Type;
  label: string;
}

const toolbarItems: ToolbarItem[] = [
  { id: 'text', icon: Type, label: '多行文字' },
  { id: 'qrcode', icon: QrCode, label: '二维码' },
  { id: 'barcode', icon: Barcode, label: '条形码' },
  { id: 'image', icon: Image, label: '图片' },
  { id: 'line', icon: Minus, label: '线条' },
  { id: 'star', icon: Star, label: '图标' },
  { id: 'square', icon: Square, label: '方形' },
  { id: 'circle', icon: Circle, label: '圆形' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultTemplate = (): LabelTemplate => ({
  id: generateId(),
  name: '新建标签',
  width: 100,
  height: 60,
  backgroundColor: '#ffffff',
  elements: [
    {
      id: generateId(),
      type: 'text',
      x: 5,
      y: 5,
      width: 90,
      height: 10,
      content: '标签标题',
      fontSize: 8,
      fontWeight: 'bold',
      color: '#1f2937',
      textAlign: 'center',
    },
    {
      id: generateId(),
      type: 'barcode',
      x: 10,
      y: 20,
      width: 80,
      height: 25,
      content: '1234567890',
      format: 'CODE128',
      backgroundColor: '#ffffff',
      lineColor: '#000000',
      displayValue: true,
      fontSize: 10,
    },
  ],
});

function App() {
  const [currentStep, setCurrentStep] = useState(2);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [template, setTemplate] = useState<LabelTemplate>(createDefaultTemplate());
  const [params, setParams] = useState<BarcodeParams>({
    content: '123456789012',
    format: 'CODE128',
    size: 200,
    width: 2,
    height: 100,
    color: '#000000',
    bgColor: '#ffffff',
    margin: 4,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const barcodeCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const { dataUrl: qrDataUrl, generate: generateQRCode } = useQRCode();
  const { canvasRef: barcodeRef, generate: generateBarcode } = useBarcode();

  const steps = [
    { id: 1, label: '导入数据' },
    { id: 2, label: '制作标签' },
    { id: 3, label: '批量导出' },
  ];

  const selectedEl = template.elements.find(el => el.id === selectedElement);

  useEffect(() => {
    if (selectedEl?.type === 'barcode' && barcodeRef.current) {
      generateBarcode({
        ...params,
        content: selectedEl.content || '',
        format: selectedEl.format || 'CODE128',
        color: (selectedEl as any).lineColor || '#000000',
        bgColor: (selectedEl as any).backgroundColor || '#ffffff',
      });
    }
    if (selectedEl?.type === 'qrcode') {
      generateQRCode({
        ...params,
        content: selectedEl.content || '',
        color: (selectedEl as any).foregroundColor || '#000000',
        bgColor: (selectedEl as any).backgroundColor || '#ffffff',
      });
    }
  }, [selectedEl, params, generateBarcode, generateQRCode, barcodeRef]);

  const handleAddElement = useCallback((type: string) => {
    const newElement: LabelElement = {
      id: `${type}-${Date.now()}`,
      type: type as LabelElement['type'],
      x: 20,
      y: 20,
      width: type === 'text' ? 80 : 60,
      height: type === 'text' ? 12 : type === 'line' ? 1 : 60,
      content: type === 'text' ? '文字内容' : type === 'qrcode' ? 'https://example.com' : type === 'barcode' ? '123456789012' : '',
      fontSize: type === 'text' ? 12 : undefined,
      fontWeight: 'normal',
      format: type === 'barcode' ? 'CODE128' : undefined,
      color: '#000000',
      backgroundColor: '#ffffff',
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElement(newElement.id);
    setActiveTool(null);
  }, []);

  const handleElementChange = useCallback((id: string, updates: Partial<LabelElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const handleSelectTemplate = (tpl: LabelTemplate) => {
    const newTemplate = {
      ...tpl,
      id: generateId(),
      elements: tpl.elements.map(el => ({ ...el, id: generateId() })),
    };
    setTemplate(newTemplate);
    setSelectedElement(null);
    setShowTemplates(false);
  };

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 8;
    canvas.width = template.width * scale;
    canvas.height = template.height * scale;

    ctx.fillStyle = template.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    template.elements.forEach(el => {
      if (el.type === 'text') {
        ctx.fillStyle = el.color || '#000000';
        ctx.font = `${el.fontWeight || 'normal'} ${(el.fontSize || 12) * scale}px sans-serif`;
        const textEl = el as any;
        const align = textEl.textAlign || 'left';
        ctx.textAlign = align as CanvasTextAlign;
        const textX = align === 'center' ? (el.x + el.width / 2) * scale : 
                      align === 'right' ? (el.x + el.width) * scale : el.x * scale;
        ctx.fillText(el.content || '', textX, (el.y + el.height * 0.8) * scale);
      } else if (el.type === 'rect') {
        ctx.fillStyle = el.color || '#000000';
        ctx.fillRect(el.x * scale, el.y * scale, el.width * scale, el.height * scale);
      } else if (el.type === 'line') {
        ctx.strokeStyle = el.color || '#000000';
        ctx.lineWidth = (el.height || 1) * scale;
        ctx.beginPath();
        ctx.moveTo(el.x * scale, el.y * scale);
        ctx.lineTo((el.x + el.width) * scale, el.y * scale);
        ctx.stroke();
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.color || '#000000';
        ctx.beginPath();
        ctx.ellipse(
          (el.x + el.width / 2) * scale,
          (el.y + el.height / 2) * scale,
          el.width / 2 * scale,
          el.height / 2 * scale,
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }
    });

    const barcodeEl = template.elements.find(el => el.type === 'barcode');
    const qrEl = template.elements.find(el => el.type === 'qrcode');

    const drawBarcode = () => {
      if (barcodeEl && barcodeRef.current) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, barcodeEl.x * scale, barcodeEl.y * scale, barcodeEl.width * scale, barcodeEl.height * scale);
          finalizeDownload(canvas);
        };
        img.src = barcodeRef.current.toDataURL('image/png');
      } else {
        finalizeDownload(canvas);
      }
    };

    const drawQRCode = () => {
      if (qrEl && qrDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, qrEl.x * scale, qrEl.y * scale, qrEl.width * scale, qrEl.height * scale);
          drawBarcode();
        };
        img.src = qrDataUrl;
      } else {
        drawBarcode();
      }
    };

    drawQRCode();
  }, [template, barcodeRef, qrDataUrl]);

  const finalizeDownload = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${generateFilename(template.name)}.png`;
    link.click();
  };

  const formats = selectedEl?.type === 'qrcode' ? qrCodeFormats : barcodeFormats;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeType="qrcode" onTypeChange={() => {}} />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-1">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-200 ${
              showTemplates
                ? 'bg-red-50 text-red-500'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-1">模板</span>
          </button>

          <div className="w-10 h-px bg-gray-200 my-1" />

          {toolbarItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleAddElement(item.id)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-200 ${
                activeTool === item.id
                  ? 'bg-red-50 text-red-500'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        {showTemplates && (
          <div className="w-60 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">选择模板</h3>
              <p className="text-xs text-gray-500 mt-1">点击模板快速创建</p>
            </div>
            <div className="p-3 space-y-3">
              {presetTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <div className="aspect-video bg-gray-50 border border-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                    <div
                      className="bg-white shadow-sm"
                      style={{
                        width: tpl.width > tpl.height ? '80%' : `${(tpl.width / tpl.height) * 60}%`,
                        height: tpl.height > tpl.width ? '80%' : `${(tpl.height / tpl.width) * 80}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-700">{tpl.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {tpl.width}mm × {tpl.height}mm
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {steps.map(step => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
                    currentStep === step.id
                      ? 'bg-red-500 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    currentStep === step.id ? 'bg-white text-red-500' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.id}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {template.name} · {template.width}mm×{template.height}mm
              </span>
              <button
                onClick={handleDownload}
                className="px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
              >
                打印和预览
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-8">
            <div
              ref={canvasRef}
              className="bg-white shadow-lg relative"
              style={{
                width: template.width * 4,
                height: template.height * 4,
                backgroundColor: template.backgroundColor,
              }}
            >
              {template.elements.map(el => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`absolute cursor-move ${
                    selectedElement === el.id
                      ? 'ring-2 ring-red-500 ring-offset-1'
                      : 'hover:ring-1 hover:ring-gray-300'
                  }`}
                  style={{
                    left: el.x * 4,
                    top: el.y * 4,
                    width: el.width * 4,
                    height: el.height * 4,
                  }}
                >
                  {el.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center"
                      style={{
                        fontSize: (el.fontSize || 12) * 4,
                        fontWeight: el.fontWeight,
                        color: el.color,
                        justifyContent: (el as any).textAlign === 'center' ? 'center' : 
                                       (el as any).textAlign === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {el.content}
                    </div>
                  )}
                  {el.type === 'barcode' && selectedElement === el.id && barcodeRef.current && (
                    <img
                      src={barcodeRef.current.toDataURL('image/png')}
                      alt="barcode"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {el.type === 'qrcode' && selectedElement === el.id && qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="qrcode"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {(el.type === 'barcode' || el.type === 'qrcode') && selectedElement !== el.id && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-200 border-dashed">
                      {el.type === 'barcode' ? (
                        <Barcode className="w-6 h-6 text-gray-400" />
                      ) : (
                        <QrCode className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}
                  {el.type === 'rect' && (
                    <div className="w-full h-full" style={{ backgroundColor: el.color }} />
                  )}
                  {el.type === 'line' && (
                    <div className="w-full h-0.5" style={{ backgroundColor: el.color, marginTop: '50%' }} />
                  )}
                  {el.type === 'circle' && (
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: el.color }} />
                  )}
                  {el.type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-200 border-dashed">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}

              <canvas ref={barcodeRef} className="hidden" />
            </div>
          </div>
        </div>

        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">属性</h3>
          </div>

          {selectedEl ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="label-text">类型</label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
                  {selectedEl.type === 'text' && '多行文字'}
                  {selectedEl.type === 'barcode' && '条形码'}
                  {selectedEl.type === 'qrcode' && '二维码'}
                  {selectedEl.type === 'rect' && '方形'}
                  {selectedEl.type === 'line' && '线条'}
                  {selectedEl.type === 'circle' && '圆形'}
                  {selectedEl.type === 'image' && '图片'}
                </div>
              </div>

              {(selectedEl.type === 'text' || selectedEl.type === 'barcode' || selectedEl.type === 'qrcode') && (
                <div>
                  <label className="label-text">内容</label>
                  <textarea
                    value={selectedEl.content || ''}
                    onChange={(e) => handleElementChange(selectedEl.id, { content: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>
              )}

              {(selectedEl.type === 'barcode' || selectedEl.type === 'qrcode') && (
                <div>
                  <label className="label-text">编码格式</label>
                  <select
                    value={selectedEl.format || (selectedEl.type === 'barcode' ? 'CODE128' : 'QRCODE')}
                    onChange={(e) => handleElementChange(selectedEl.id, { format: e.target.value })}
                    className="input-field"
                  >
                    {formats.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">X (mm)</label>
                  <input
                    type="number"
                    value={selectedEl.x}
                    onChange={(e) => handleElementChange(selectedEl.id, { x: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">Y (mm)</label>
                  <input
                    type="number"
                    value={selectedEl.y}
                    onChange={(e) => handleElementChange(selectedEl.id, { y: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">宽度 (mm)</label>
                  <input
                    type="number"
                    value={selectedEl.width}
                    onChange={(e) => handleElementChange(selectedEl.id, { width: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">高度 (mm)</label>
                  <input
                    type="number"
                    value={selectedEl.height}
                    onChange={(e) => handleElementChange(selectedEl.id, { height: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              {selectedEl.type === 'text' && (
                <>
                  <div>
                    <label className="label-text">字体大小</label>
                    <input
                      type="number"
                      value={selectedEl.fontSize || 12}
                      onChange={(e) => handleElementChange(selectedEl.id, { fontSize: parseFloat(e.target.value) || 12 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">字体粗细</label>
                    <select
                      value={selectedEl.fontWeight || 'normal'}
                      onChange={(e) => handleElementChange(selectedEl.id, { fontWeight: e.target.value })}
                      className="input-field"
                    >
                      <option value="normal">正常</option>
                      <option value="bold">粗体</option>
                      <option value="lighter">细体</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">文字对齐</label>
                    <select
                      value={(selectedEl as any).textAlign || 'left'}
                      onChange={(e) => handleElementChange(selectedEl.id, { textAlign: e.target.value } as any)}
                      className="input-field"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                </>
              )}

              {selectedEl.type === 'barcode' && (
                <div>
                  <label className="label-text">
                    <input
                      type="checkbox"
                      checked={(selectedEl as any).displayValue !== false}
                      onChange={(e) => handleElementChange(selectedEl.id, { displayValue: e.target.checked } as any)}
                      className="mr-2"
                    />
                    显示文本
                  </label>
                </div>
              )}

              {selectedEl.type !== 'image' && (
                <div>
                  <label className="label-text">{selectedEl.type === 'barcode' ? '线条颜色' : selectedEl.type === 'qrcode' ? '前景色' : '颜色'}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedEl.type === 'barcode' ? (selectedEl as any).lineColor || '#000000' : 
                             selectedEl.type === 'qrcode' ? (selectedEl as any).foregroundColor || '#000000' : 
                             selectedEl.color || '#000000'}
                      onChange={(e) => {
                        if (selectedEl.type === 'barcode') {
                          handleElementChange(selectedEl.id, { lineColor: e.target.value } as any);
                        } else if (selectedEl.type === 'qrcode') {
                          handleElementChange(selectedEl.id, { foregroundColor: e.target.value } as any);
                        } else {
                          handleElementChange(selectedEl.id, { color: e.target.value });
                        }
                      }}
                      className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={selectedEl.type === 'barcode' ? (selectedEl as any).lineColor || '#000000' : 
                             selectedEl.type === 'qrcode' ? (selectedEl as any).foregroundColor || '#000000' : 
                             selectedEl.color || '#000000'}
                      onChange={(e) => {
                        if (selectedEl.type === 'barcode') {
                          handleElementChange(selectedEl.id, { lineColor: e.target.value } as any);
                        } else if (selectedEl.type === 'qrcode') {
                          handleElementChange(selectedEl.id, { foregroundColor: e.target.value } as any);
                        } else {
                          handleElementChange(selectedEl.id, { color: e.target.value });
                        }
                      }}
                      className="flex-1 input-field"
                    />
                  </div>
                </div>
              )}

              {(selectedEl.type === 'qrcode' || selectedEl.type === 'barcode') && (
                <div>
                  <label className="label-text">背景色</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={(selectedEl as any).backgroundColor || '#ffffff'}
                      onChange={(e) => handleElementChange(selectedEl.id, { backgroundColor: e.target.value } as any)}
                      className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={(selectedEl as any).backgroundColor || '#ffffff'}
                      onChange={(e) => handleElementChange(selectedEl.id, { backgroundColor: e.target.value } as any)}
                      className="flex-1 input-field"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleDeleteElement(selectedEl.id)}
                className="w-full px-4 py-2 border border-red-300 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
              >
                删除元素
              </button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 text-center">选择一个元素以编辑其属性</p>
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">画布设置</h3>
            <div className="space-y-3">
              <div>
                <label className="label-text">标签名称</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">宽度 (mm)</label>
                  <input
                    type="number"
                    value={template.width}
                    onChange={(e) => setTemplate(prev => ({ ...prev, width: parseFloat(e.target.value) || 100 }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">高度 (mm)</label>
                  <input
                    type="number"
                    value={template.height}
                    onChange={(e) => setTemplate(prev => ({ ...prev, height: parseFloat(e.target.value) || 60 }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label-text">背景色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.backgroundColor || '#ffffff'}
                    onChange={(e) => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={template.backgroundColor || '#ffffff'}
                    onChange={(e) => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="flex-1 input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;