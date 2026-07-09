import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Settings, Download, ChevronRight, Plus, Trash2, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

// 导入数据上限
const MAX_IMPORT = 300;

// 步骤定义
const STEPS = [
  { id: 1, title: '导入数据', icon: Upload },
  { id: 2, title: '编辑二维码', icon: Settings },
  { id: 3, title: '批量导出', icon: Download },
];

// 二维码设置接口
interface QRCodeSettings {
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color: {
    dark: string;
    light: string;
  };
  footnote1: string;
  footnote2: string;
  footnotePosition: 'top' | 'bottom';
  footnoteSize: number;
  dpiScale: number;
}

// 默认二维码设置 - 参考 y56y.com 的默认尺寸 (30*30mm)
const DEFAULT_SETTINGS: QRCodeSettings = {
  size: 150,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  footnote1: '',
  footnote2: '',
  footnotePosition: 'bottom',
  footnoteSize: 12,
  dpiScale: 2,
};

// 数据项接口
interface DataItem {
  id: string;
  value: string;
  footnote?: string;
}

const QRCodeBatch = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dataItems, setDataItems] = useState<DataItem[]>(() => {
    try {
      const saved = localStorage.getItem('qrcode_data_items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [textInput, setTextInput] = useState('');
  const [settings, setSettings] = useState<QRCodeSettings>(() => {
    try {
      const saved = localStorage.getItem('qrcode_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'footnote1' | 'footnote2'>('basic');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [exportPreviewUrls, setExportPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 数据保存到本地
  useEffect(() => {
    localStorage.setItem('qrcode_data_items', JSON.stringify(dataItems));
  }, [dataItems]);

  useEffect(() => {
    localStorage.setItem('qrcode_settings', JSON.stringify(settings));
  }, [settings]);

  // 容错级别说明
  const ERROR_CORRECTION_LEVELS = [
    { value: 'L', label: 'L - 低 (7%)', desc: '适合干净环境' },
    { value: 'M', label: 'M - 中 (15%)', desc: '默认推荐' },
    { value: 'Q', label: 'Q - 较高 (25%)', desc: '适合有遮挡' },
    { value: 'H', label: 'H - 高 (30%)', desc: '适合 logo 嵌入' },
  ];

  // 生成二维码
  const generateQRCode = useCallback(async (value: string, settings: QRCodeSettings): Promise<string> => {
    try {
      return await QRCode.toDataURL(value, {
        width: settings.size,
        margin: settings.margin,
        errorCorrectionLevel: settings.errorCorrectionLevel,
        color: settings.color,
      });
    } catch {
      return '';
    }
  }, []);

  // 进入步骤2或切换预览索引时自动生成预览（高清）
  useEffect(() => {
    if (currentStep === 2 && dataItems[previewIndex]) {
      const scale = settings.dpiScale || 2;
      generateQRCode(dataItems[previewIndex].value, {
        ...settings,
        size: settings.size * scale,
      }).then(url => setPreviewUrl(url));
    }
  }, [currentStep, previewIndex, settings, dataItems, generateQRCode]);

  // 进入步骤3时生成导出预览
  useEffect(() => {
    if (currentStep === 3) {
      const previewItems = dataItems.slice(0, 9);
      Promise.all(
        previewItems.map(item =>
          generateQRCode(item.value, { ...settings, size: 80 })
        )
      ).then(urls => setExportPreviewUrls(urls));
    }
  }, [currentStep, dataItems, settings, generateQRCode]);

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
    setPreviewIndex(0);
    if (newItems.length > 0) {
      setCurrentStep(2);
      generateQRCode(newItems[0].value, settings).then(url => setPreviewUrl(url));
    }
  };

  // 导入CSV/TXT文件
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length > MAX_IMPORT) {
        setImportError(`导入失败：数据超过 ${MAX_IMPORT} 条限制（当前 ${lines.length} 条）`);
        return;
      }
      setImportError('');

      const newItems: DataItem[] = lines.map((line, index) => {
        const cols = line.split(/[,;\t]/);
        return {
          id: `item-${Date.now()}-${index}`,
          value: cols[0]?.trim() || '',
          footnote: cols[1]?.trim() || '',
        };
      }).filter(item => item.value);

      setDataItems(newItems);
      setPreviewIndex(0);
      if (newItems.length > 0) {
        setCurrentStep(2);
        const url = await generateQRCode(newItems[0].value, settings);
        setPreviewUrl(url);
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
      setPreviewUrl('');
      setTextInput('');
      setImportError('');
      setExportPreviewUrls([]);
    }
  };

  // 更新数据项
  const handleUpdateItem = (id: string, field: keyof DataItem, value: string) => {
    setDataItems(dataItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 生成单张二维码图片Canvas（高清）
  const generateQRCodeCanvas = useCallback(async (item: DataItem): Promise<HTMLCanvasElement | null> => {
    const scale = settings.dpiScale || 1;
    const qrUrl = await generateQRCode(item.value, {
      ...settings,
      size: settings.size * scale,
    });
    if (!qrUrl) return null;

    const canvas = document.createElement('canvas');
    canvas.width = (settings.size + settings.margin * 2) * scale;
    canvas.height = (settings.size + settings.margin * 2) * scale + (settings.footnote1 ? (settings.footnoteSize + 10) * scale : 0);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = settings.color.light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.src = qrUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    ctx.drawImage(img, 0, 0);

    if (settings.footnote1) {
      ctx.fillStyle = '#000000';
      ctx.font = `${settings.footnoteSize * scale}px sans-serif`;
      ctx.textAlign = 'center';
      const y = settings.footnotePosition === 'top'
        ? (settings.footnoteSize + 5) * scale
        : canvas.height - 5 * scale;
      ctx.fillText(settings.footnote1, canvas.width / 2, y);
    }

    return canvas;
  }, [settings, generateQRCode]);

  // 下载单个二维码
  const handleDownloadSingle = async (item: DataItem) => {
    const canvas = await generateQRCodeCanvas(item);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${item.value || 'qrcode'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 导出PNG
  const handleExportPNG = async () => {
    for (const item of dataItems) {
      const canvas = await generateQRCodeCanvas(item);
      if (!canvas) continue;

      const link = document.createElement('a');
      link.download = `${item.value || 'qrcode'}-${item.id}.png`;
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
  const updateSetting = <K extends keyof QRCodeSettings>(key: K, value: QRCodeSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (dataItems[previewIndex]) {
      generateQRCode(dataItems[previewIndex].value, newSettings).then(url => setPreviewUrl(url));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-4 text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-medium">批量二维码生成 - 移动版</h1>
        </div>
      </header>

      {/* Steps Progress */}
      <div className="bg-white border-b sticky top-[56px] z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                currentStep === step.id
                  ? 'text-purple-600'
                  : currentStep > step.id
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id
                    ? 'bg-purple-600 text-white'
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
                  placeholder="请输入二维码内容，每行一条..."
                  className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleImportText}
                  disabled={!textInput.trim()}
                  className="mt-2 w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:text-gray-500"
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
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors"
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
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-100 transition-colors"
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
                        placeholder="二维码内容"
                      />
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        className="p-1 text-gray-400 hover:text-purple-500"
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

        {/* Step 2: Edit QRCode */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">二维码预览</h3>
                {dataItems[previewIndex] && (
                  <button
                    onClick={() => handleDownloadSingle(dataItems[previewIndex])}
                    className="text-purple-600 text-sm flex items-center gap-1"
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
                        alt="QR Code Preview"
                        className="mx-auto"
                        style={{ maxWidth: '200px' }}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      第 {previewIndex + 1} 条 / 共 {dataItems.length} 条
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {dataItems[previewIndex].value}
                    </p>
                    {dataItems.length > 1 && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            const newIndex = Math.max(0, previewIndex - 1);
                            setPreviewIndex(newIndex);
                            const scale = settings.dpiScale || 2;
                            generateQRCode(dataItems[newIndex].value, {
                              ...settings,
                              size: settings.size * scale,
                            }).then(url => setPreviewUrl(url));
                          }}
                          disabled={previewIndex === 0}
                          className="px-3 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                        >
                          上一条
                        </button>
                        <button
                          onClick={() => {
                            const newIndex = Math.min(dataItems.length - 1, previewIndex + 1);
                            setPreviewIndex(newIndex);
                            const scale = settings.dpiScale || 2;
                            generateQRCode(dataItems[newIndex].value, {
                              ...settings,
                              size: settings.size * scale,
                            }).then(url => setPreviewUrl(url));
                          }}
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
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-3 text-sm whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-purple-600 border-b-2 border-purple-600'
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
                    {/* Size */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">二维码尺寸: {settings.size}px</label>
                      <input
                        type="range"
                        min="100"
                        max="400"
                        step="10"
                        value={settings.size}
                        onChange={(e) => updateSetting('size', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>100px</span>
                        <span>400px</span>
                      </div>
                    </div>

                    {/* Margin */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">边距: {settings.margin}</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={settings.margin}
                        onChange={(e) => updateSetting('margin', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Error Correction Level */}
                    <div className="relative">
                      <label className="text-sm text-gray-600 mb-2 block">容错级别</label>
                      <button
                        onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm flex items-center justify-between"
                      >
                        {ERROR_CORRECTION_LEVELS.find(l => l.value === settings.errorCorrectionLevel)?.label}
                        {showLevelDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showLevelDropdown && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
                          {ERROR_CORRECTION_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              onClick={() => {
                                updateSetting('errorCorrectionLevel', level.value as QRCodeSettings['errorCorrectionLevel']);
                                setShowLevelDropdown(false);
                              }}
                              className={`w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 ${
                                settings.errorCorrectionLevel === level.value ? 'bg-purple-50 text-purple-600' : ''
                              }`}
                            >
                              <div>{level.label}</div>
                              <div className="text-xs text-gray-400">{level.desc}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">二维码颜色</label>
                        <input
                          type="color"
                          value={settings.color.dark}
                          onChange={(e) => updateSetting('color', { ...settings.color, dark: e.target.value })}
                          className="w-full h-10 rounded-lg border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">背景颜色</label>
                        <input
                          type="color"
                          value={settings.color.light}
                          onChange={(e) => updateSetting('color', { ...settings.color, light: e.target.value })}
                          className="w-full h-10 rounded-lg border border-gray-200"
                        />
                      </div>
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
                                ? 'bg-purple-600 text-white'
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
                        value={settings[activeTab as keyof QRCodeSettings] as string}
                        onChange={(e) => updateSetting(activeTab as keyof QRCodeSettings, e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
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
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              顶部
                            </button>
                            <button
                              onClick={() => updateSetting('footnotePosition', 'bottom')}
                              className={`flex-1 py-2 rounded-lg text-sm ${
                                settings.footnotePosition === 'bottom'
                                  ? 'bg-purple-600 text-white'
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
                    {exportPreviewUrls[index] ? (
                      <img
                        src={exportPreviewUrls[index]}
                        alt={item.value}
                        className="mx-auto"
                        style={{ width: '60px', height: '60px' }}
                      />
                    ) : (
                      <div
                        className="mx-auto bg-gray-100 rounded animate-pulse"
                        style={{ width: '60px', height: '60px' }}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.value.slice(0, 10)}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                共 {dataItems.length} 条二维码待导出
              </p>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-3">导出格式</h3>

              <button
                onClick={handleExportPNG}
                className="w-full bg-purple-600 text-white py-3 rounded-lg text-sm font-medium mb-3"
              >
                <Download className="w-4 h-4 inline mr-2" />
                批量导出PNG图片
              </button>

              <p className="text-xs text-gray-400 text-center">
                点击后将逐个下载所有二维码图片
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
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-purple-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
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

export default QRCodeBatch;