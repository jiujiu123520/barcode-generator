import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Settings, Download, ChevronRight, Plus, Trash2, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode';

// 导入数据上限
const MAX_IMPORT = 300;

// 步骤定义
const STEPS = [
  { id: 1, title: '导入数据', icon: Upload },
  { id: 2, title: '编辑条形码', icon: Settings },
  { id: 3, title: '批量导出', icon: Download },
];

// 条形码格式列表
const BARCODE_FORMATS = [
  { value: 'CODE128', label: 'CODE128 (通用)', default: true },
  { value: 'EAN13', label: 'EAN-13 (商品条码)', length: 12 },
  { value: 'EAN8', label: 'EAN-8', length: 7 },
  { value: 'UPC', label: 'UPC-A', length: 11 },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'ITF14', label: 'ITF-14 (物流)', length: 13 },
  { value: 'MSI', label: 'MSI' },
  { value: 'pharmacode', label: 'Pharmacode (医药)' },
];

// 条形码设置接口
interface BarcodeSettings {
  format: string;
  width: number;       // 条码宽度 (像素)
  height: number;      // 条码高度 (像素)
  displayValue: boolean;
  fontSize: number;
  fontOptions: string;
  textAlign: string;
  margin: number;
  background: string;
  lineColor: string;
  // 附加设置
  footnote1: string;
  footnote2: string;
  footnote3: string;
  footnote4: string;
  footnote5: string;
  footnotePosition: 'top' | 'bottom';
  footnoteSize: number;
  // 清晰度倍率
  dpiScale: number;
}

// 默认条形码设置 - 参考 y56y.com 的默认尺寸 (40*20mm ≈ 150*75px @300dpi)
const DEFAULT_SETTINGS: BarcodeSettings = {
  format: 'CODE128',
  width: 2,
  height: 50,
  displayValue: true,
  fontSize: 14,
  fontOptions: '',
  textAlign: 'center',
  margin: 10,
  background: '#ffffff',
  lineColor: '#000000',
  footnote1: '',
  footnote2: '',
  footnote3: '',
  footnote4: '',
  footnote5: '',
  footnotePosition: 'bottom',
  footnoteSize: 12,
  dpiScale: 3,
};

// 数据项接口
interface DataItem {
  id: string;
  value: string;
  footnote1?: string;
  footnote2?: string;
  footnote3?: string;
}

const BarcodeBatch = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dataItems, setDataItems] = useState<DataItem[]>(() => {
    try {
      const saved = localStorage.getItem('barcode_data_items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [textInput, setTextInput] = useState('');
  const [settings, setSettings] = useState<BarcodeSettings>(() => {
    try {
      const saved = localStorage.getItem('barcode_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'footnote1' | 'footnote2' | 'footnote3' | 'footnote4' | 'footnote5'>('basic');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 数据保存到本地
  useEffect(() => {
    localStorage.setItem('barcode_data_items', JSON.stringify(dataItems));
  }, [dataItems]);

  useEffect(() => {
    localStorage.setItem('barcode_settings', JSON.stringify(settings));
  }, [settings]);

  // 生成条形码到Canvas
  const generateBarcode = useCallback((canvas: HTMLCanvasElement, value: string, settings: BarcodeSettings) => {
    try {
      JsBarcode(canvas, value, {
        format: settings.format,
        width: settings.width,
        height: settings.height,
        displayValue: settings.displayValue,
        fontSize: settings.fontSize,
        fontOptions: settings.fontOptions,
        textAlign: settings.textAlign as 'left' | 'center' | 'right',
        margin: settings.margin,
        background: settings.background,
        lineColor: settings.lineColor,
      });
    } catch (error) {
      // 无效数据时显示错误
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#dc2626';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('无效数据', canvas.width / 2, canvas.height / 2);
      }
    }
  }, []);

  // 预览随设置和索引变化而更新（高清）
  useEffect(() => {
    if (currentStep === 2 && dataItems[previewIndex]) {
      const item = dataItems[previewIndex];
      const baseCanvas = document.createElement('canvas');
      generateBarcode(baseCanvas, item.value || '', settings);

      const hasFootnote = settings.footnote1 || settings.footnote2 || settings.footnote3 || item.footnote1;
      const extraHeight = hasFootnote ? settings.footnoteSize + 10 : 0;
      const totalWidth = baseCanvas.width;
      const totalHeight = baseCanvas.height + extraHeight;

      const scale = settings.dpiScale || 2;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = totalWidth * scale;
      finalCanvas.height = totalHeight * scale;

      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.fillStyle = settings.background;
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        const canvasToScale = document.createElement('canvas');
        canvasToScale.width = totalWidth;
        canvasToScale.height = totalHeight;
        const ctx = canvasToScale.getContext('2d');
        if (ctx) {
          ctx.fillStyle = settings.background;
          ctx.fillRect(0, 0, totalWidth, totalHeight);

          if (hasFootnote && settings.footnotePosition === 'top') {
            ctx.drawImage(baseCanvas, 0, extraHeight);
            ctx.fillStyle = settings.lineColor;
            ctx.font = `${settings.footnoteSize}px sans-serif`;
            ctx.textAlign = 'center';
            let footnoteText = '';
            if (settings.footnote1) footnoteText += settings.footnote1 + ' ';
            if (settings.footnote2) footnoteText += settings.footnote2 + ' ';
            if (settings.footnote3) footnoteText += settings.footnote3 + ' ';
            if (item.footnote1) footnoteText += item.footnote1;
            ctx.fillText(footnoteText.trim(), totalWidth / 2, settings.footnoteSize);
          } else {
            ctx.drawImage(baseCanvas, 0, 0);
            if (hasFootnote) {
              ctx.fillStyle = settings.lineColor;
              ctx.font = `${settings.footnoteSize}px sans-serif`;
              ctx.textAlign = 'center';
              let footnoteText = '';
              if (settings.footnote1) footnoteText += settings.footnote1 + ' ';
              if (settings.footnote2) footnoteText += settings.footnote2 + ' ';
              if (settings.footnote3) footnoteText += settings.footnote3 + ' ';
              if (item.footnote1) footnoteText += item.footnote1;
              ctx.fillText(footnoteText.trim(), totalWidth / 2, totalHeight - 5);
            }
          }
        }

        finalCtx.drawImage(canvasToScale, 0, 0, finalCanvas.width, finalCanvas.height);
      }

      setPreviewUrl(finalCanvas.toDataURL('image/png'));
    }
  }, [currentStep, previewIndex, settings, dataItems, generateBarcode]);

  // 导入文本数据
  const handleImportText = () => {
    const lines = textInput.split('\n').filter(line => line.trim());
    if (lines.length > MAX_IMPORT) {
      setImportError(`导入失败：数据超过 ${MAX_IMPORT} 条限制（当前 ${lines.length} 条）`);
      return;
    }
    setImportError('');
    const newItems: DataItem[] = lines.map((line, index) => ({
      id: `item-${Date.now()}-${index}`,
      value: line.trim(),
    }));
    setDataItems(newItems);
    if (newItems.length > 0) {
      setCurrentStep(2);
    }
  };

  // 导入Excel/CSV文件
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length > MAX_IMPORT) {
        setImportError(`导入失败：数据超过 ${MAX_IMPORT} 条限制（当前 ${lines.length} 条）`);
        return;
      }
      setImportError('');

      // CSV格式处理
      const newItems: DataItem[] = lines.map((line, index) => {
        const cols = line.split(/[,;\t]/);
        return {
          id: `item-${Date.now()}-${index}`,
          value: cols[0]?.trim() || '',
          footnote1: cols[1]?.trim() || '',
          footnote2: cols[2]?.trim() || '',
          footnote3: cols[3]?.trim() || '',
        };
      }).filter(item => item.value);

      setDataItems(newItems);
      if (newItems.length > 0) {
        setCurrentStep(2);
      }
    };
    reader.readAsText(file);
    // 重置input，允许重复选择同一文件
    e.target.value = '';
  };

  // 添加单条数据
  const handleAddItem = () => {
    if (dataItems.length >= MAX_IMPORT) {
      setImportError(`已达上限：最多 ${MAX_IMPORT} 条数据`);
      return;
    }
    setImportError('');
    const newItem: DataItem = {
      id: `item-${Date.now()}`,
      value: '',
    };
    setDataItems([...dataItems, newItem]);
  };

  // 删除数据项
  const handleRemoveItem = (id: string) => {
    const newItems = dataItems.filter(item => item.id !== id);
    setDataItems(newItems);
    if (previewIndex >= newItems.length) {
      setPreviewIndex(Math.max(0, newItems.length - 1));
    }
  };

  // 清空所有数据
  const handleClearAll = () => {
    if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      setDataItems([]);
      setPreviewIndex(0);
      setTextInput('');
      setImportError('');
    }
  };

  // 更新数据项
  const handleUpdateItem = (id: string, field: keyof DataItem, value: string) => {
    setDataItems(dataItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 生成单张条形码图片Canvas（高清）
  const generateBarcodeCanvas = useCallback((item: DataItem): HTMLCanvasElement => {
    const baseCanvas = document.createElement('canvas');
    generateBarcode(baseCanvas, item.value, settings);

    const hasFootnote = settings.footnote1 || settings.footnote2 || settings.footnote3 || item.footnote1;
    const extraHeight = hasFootnote ? settings.footnoteSize + 10 : 0;

    const totalWidth = baseCanvas.width;
    const totalHeight = baseCanvas.height + extraHeight;

    const scale = settings.dpiScale || 1;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = totalWidth * scale;
    finalCanvas.height = totalHeight * scale;

    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.imageSmoothingEnabled = false;
      finalCtx.fillStyle = settings.background;
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      const canvasToScale = document.createElement('canvas');
      canvasToScale.width = totalWidth;
      canvasToScale.height = totalHeight;
      const ctx = canvasToScale.getContext('2d');
      if (ctx) {
        ctx.fillStyle = settings.background;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        if (hasFootnote && settings.footnotePosition === 'top') {
          ctx.drawImage(baseCanvas, 0, extraHeight);
          ctx.fillStyle = settings.lineColor;
          ctx.font = `${settings.footnoteSize}px sans-serif`;
          ctx.textAlign = 'center';
          let footnoteText = '';
          if (settings.footnote1) footnoteText += settings.footnote1 + ' ';
          if (settings.footnote2) footnoteText += settings.footnote2 + ' ';
          if (settings.footnote3) footnoteText += settings.footnote3 + ' ';
          if (item.footnote1) footnoteText += item.footnote1;
          ctx.fillText(footnoteText.trim(), totalWidth / 2, settings.footnoteSize);
        } else {
          ctx.drawImage(baseCanvas, 0, 0);
          if (hasFootnote) {
            ctx.fillStyle = settings.lineColor;
            ctx.font = `${settings.footnoteSize}px sans-serif`;
            ctx.textAlign = 'center';
            let footnoteText = '';
            if (settings.footnote1) footnoteText += settings.footnote1 + ' ';
            if (settings.footnote2) footnoteText += settings.footnote2 + ' ';
            if (settings.footnote3) footnoteText += settings.footnote3 + ' ';
            if (item.footnote1) footnoteText += item.footnote1;
            ctx.fillText(footnoteText.trim(), totalWidth / 2, totalHeight - 5);
          }
        }
      }

      finalCtx.drawImage(canvasToScale, 0, 0, finalCanvas.width, finalCanvas.height);
    }

    return finalCanvas;
  }, [settings, generateBarcode]);

  // 下载单个条形码
  const handleDownloadSingle = (item: DataItem) => {
    const canvas = generateBarcodeCanvas(item);
    const link = document.createElement('a');
    link.download = `${item.value || 'barcode'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 导出PNG
  const handleExportPNG = async () => {
    for (const item of dataItems) {
      const canvas = generateBarcodeCanvas(item);
      const link = document.createElement('a');
      link.download = `${item.value || 'barcode'}-${item.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // 步骤导航
  const canGoNext = () => {
    if (currentStep === 1) return dataItems.length > 0;
    if (currentStep === 2) return true;
    return false;
  };

  const handleNextStep = () => {
    if (canGoNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 更新设置
  const updateSetting = <K extends keyof BarcodeSettings>(key: K, value: BarcodeSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-medium">批量条形码生成 - 移动版</h1>
        </div>
      </header>

      {/* Steps Progress */}
      <div className="bg-white border-b sticky top-[56px] z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                currentStep === step.id 
                  ? 'text-blue-600' 
                  : currentStep > step.id 
                    ? 'text-green-600' 
                    : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id 
                    ? 'bg-blue-600 text-white' 
                    : currentStep > step.id 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                <span className="text-sm font-medium sm:hidden">{step.id}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-4 pb-20">
        {/* Step 1: Import Data */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Import Methods */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">导入方式</h3>
                <span className="text-xs text-gray-400">上限 {MAX_IMPORT} 条</span>
              </div>

              {importError && (
                <div className="mb-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
              
              {/* Text Input */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">手动输入（每行一条数据）</label>
                <textarea
                  value={textInput}
                  onChange={(e) => { setTextInput(e.target.value); setImportError(''); }}
                  placeholder="请输入条码内容，每行一条..."
                  className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleImportText}
                  disabled={!textInput.trim()}
                  className="mt-2 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:text-gray-500"
                >
                  确认导入
                </button>
              </div>

              {/* File Import */}
              <div className="border-t pt-4">
                <label className="text-sm text-gray-600 mb-2 block">文件导入（CSV/TXT）</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">点击选择文件</span>
                </button>
              </div>
            </div>

            {/* Data List */}
            {dataItems.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">已导入数据 ({dataItems.length}条)</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-1 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空
                    </button>
                    <button
                      onClick={handleAddItem}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {dataItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                      <input
                        value={item.value}
                        onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                        className="flex-1 px-2 py-1 border-0 bg-transparent text-sm focus:outline-none"
                        placeholder="条码内容"
                      />
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="下载"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Edit Barcode */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">条形码预览</h3>
                {dataItems[previewIndex] && (
                  <button
                    onClick={() => handleDownloadSingle(dataItems[previewIndex])}
                    className="text-blue-600 text-sm flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    下载当前
                  </button>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
                {dataItems[previewIndex] && (
                  <div className="text-center">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Barcode Preview"
                        className="mx-auto"
                        style={{ maxWidth: '100%', maxHeight: '200px' }}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      第 {previewIndex + 1} 条 / 共 {dataItems.length} 条
                    </p>
                    {dataItems.length > 1 && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                          disabled={previewIndex === 0}
                          className="px-3 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                        >
                          上一条
                        </button>
                        <button
                          onClick={() => setPreviewIndex(Math.min(dataItems.length - 1, previewIndex + 1))}
                          disabled={previewIndex === dataItems.length - 1}
                          className="px-3 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                        >
                          下一条
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Settings Tabs */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="flex border-b overflow-x-auto">
                {[
                  { key: 'basic', label: '基本设置' },
                  { key: 'footnote1', label: '脚注附加1' },
                  { key: 'footnote2', label: '附加2' },
                  { key: 'footnote3', label: '附加3' },
                  { key: 'footnote4', label: '附加4' },
                  { key: 'footnote5', label: '附加5' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-3 text-sm whitespace-nowrap ${
                      activeTab === tab.key 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Basic Settings */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* Format */}
                    <div className="relative">
                      <label className="text-sm text-gray-600 mb-2 block">条码格式</label>
                      <button
                        onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm flex items-center justify-between"
                      >
                        {BARCODE_FORMATS.find(f => f.value === settings.format)?.label}
                        {showFormatDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showFormatDropdown && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
                          {BARCODE_FORMATS.map((format) => (
                            <button
                              key={format.value}
                              onClick={() => {
                                updateSetting('format', format.value);
                                setShowFormatDropdown(false);
                              }}
                              className={`w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 ${
                                settings.format === format.value ? 'bg-blue-50 text-blue-600' : ''
                              }`}
                            >
                              {format.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Width */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">条码宽度: {settings.width}px</label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.5"
                        value={settings.width}
                        onChange={(e) => updateSetting('width', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">条码高度: {settings.height}px</label>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        step="5"
                        value={settings.height}
                        onChange={(e) => updateSetting('height', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Display Value */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">显示条码内容</label>
                      <button
                        onClick={() => updateSetting('displayValue', !settings.displayValue)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.displayValue ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          settings.displayValue ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">文字大小: {settings.fontSize}px</label>
                      <input
                        type="range"
                        min="10"
                        max="20"
                        step="1"
                        value={settings.fontSize}
                        onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">线条颜色</label>
                        <input
                          type="color"
                          value={settings.lineColor}
                          onChange={(e) => updateSetting('lineColor', e.target.value)}
                          className="w-full h-10 rounded-lg border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">背景颜色</label>
                        <input
                          type="color"
                          value={settings.background}
                          onChange={(e) => updateSetting('background', e.target.value)}
                          className="w-full h-10 rounded-lg border border-gray-200"
                        />
                      </div>
                    </div>

                    {/* Margin */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">边距: {settings.margin}px</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="2"
                        value={settings.margin}
                        onChange={(e) => updateSetting('margin', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* DPI Scale */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">清晰度: {settings.dpiScale}x (高清)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((scale) => (
                          <button
                            key={scale}
                            onClick={() => updateSetting('dpiScale', scale)}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                              settings.dpiScale === scale
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {scale}x
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        倍率越高越清晰，文件也越大
                      </p>
                    </div>
                  </div>
                )}

                {/* Footnote Settings */}
                {activeTab.startsWith('footnote') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">
                        {activeTab === 'footnote1' ? '脚注内容' : '附加内容'}
                      </label>
                      <input
                        type="text"
                        value={settings[activeTab]}
                        onChange={(e) => updateSetting(activeTab as keyof BarcodeSettings, e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="输入脚注内容..."
                      />
                    </div>

                    {activeTab === 'footnote1' && (
                      <>
                        <div>
                          <label className="text-sm text-gray-600 mb-2 block">脚注位置</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSetting('footnotePosition', 'top')}
                              className={`flex-1 py-2 rounded-lg text-sm ${
                                settings.footnotePosition === 'top' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              顶部
                            </button>
                            <button
                              onClick={() => updateSetting('footnotePosition', 'bottom')}
                              className={`flex-1 py-2 rounded-lg text-sm ${
                                settings.footnotePosition === 'bottom' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              底部
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-600 mb-2 block">脚注大小: {settings.footnoteSize}px</label>
                          <input
                            type="range"
                            min="8"
                            max="16"
                            step="1"
                            value={settings.footnoteSize}
                            onChange={(e) => updateSetting('footnoteSize', Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Export */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-3">导出预览</h3>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-4">
                {dataItems.slice(0, 9).map((item, index) => (
                  <div key={item.id} className="text-center bg-white rounded-lg p-2">
                    <canvas 
                      ref={(canvas) => {
                        if (canvas) {
                          canvas.width = 100;
                          canvas.height = 50;
                          generateBarcode(canvas, item.value, { ...settings, width: 1, height: 25, fontSize: 8, margin: 5 });
                        }
                      }}
                      className="mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                共 {dataItems.length} 条条形码待导出
              </p>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-3">导出格式</h3>
              
              <button
                onClick={handleExportPNG}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium mb-3"
              >
                <Download className="w-4 h-4 inline mr-2" />
                批量导出PNG图片
              </button>

              <p className="text-xs text-gray-400 text-center">
                点击后将逐个下载所有条形码图片
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center justify-between gap-4">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-50"
        >
          上一步
        </button>
        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            disabled={!canGoNext()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleExportPNG}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white"
          >
            开始导出
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeBatch;