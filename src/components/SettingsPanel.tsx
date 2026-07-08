import { Settings, Palette, Maximize2, Minimize2 } from 'lucide-react';
import type { BarcodeParams, BarcodeFormat } from '@/types';

interface SettingsPanelProps {
  formats: BarcodeFormat[];
  params: BarcodeParams;
  isQRCode: boolean;
  onParamsChange: (params: Partial<BarcodeParams>) => void;
}

export const SettingsPanel = ({ formats, params, isQRCode, onParamsChange }: SettingsPanelProps) => {
  return (
    <div className="bg-dark-800/50 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-primary-400" />
        <h2 className="text-lg font-semibold text-white">参数设置</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">编码格式</label>
          <select
            value={params.format}
            onChange={(e) => onParamsChange({ format: e.target.value })}
            className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
          >
            {formats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label} - {format.description}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isQRCode ? (
            <div>
              <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
                <Maximize2 className="w-4 h-4" />
                <span>尺寸</span>
              </label>
              <input
                type="range"
                min="100"
                max="500"
                value={params.size || 256}
                onChange={(e) => onParamsChange({ size: parseInt(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="text-right text-sm text-dark-400 mt-1">{params.size || 256}px</div>
            </div>
          ) : (
            <>
              <div>
                <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
                  <Minimize2 className="w-4 h-4" />
                  <span>宽度</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={params.width || 2}
                  onChange={(e) => onParamsChange({ width: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="text-right text-sm text-dark-400 mt-1">{params.width || 2}</div>
              </div>
              <div>
                <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
                  <Maximize2 className="w-4 h-4" />
                  <span>高度</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="200"
                  value={params.height || 100}
                  onChange={(e) => onParamsChange({ height: parseInt(e.target.value) })}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="text-right text-sm text-dark-400 mt-1">{params.height || 100}px</div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
              <Palette className="w-4 h-4" />
              <span>前景色</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={params.color || '#000000'}
                onChange={(e) => onParamsChange({ color: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={params.color || '#000000'}
                onChange={(e) => onParamsChange({ color: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
              <Palette className="w-4 h-4" />
              <span>背景色</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={params.bgColor || '#ffffff'}
                onChange={(e) => onParamsChange({ bgColor: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={params.bgColor || '#ffffff'}
                onChange={(e) => onParamsChange({ bgColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-1 text-sm font-medium text-dark-300 mb-2">
            <Minimize2 className="w-4 h-4" />
            <span>边距</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={params.margin || (isQRCode ? 4 : 10)}
            onChange={(e) => onParamsChange({ margin: parseInt(e.target.value) })}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="text-right text-sm text-dark-400 mt-1">{params.margin || (isQRCode ? 4 : 10)}px</div>
        </div>
      </div>
    </div>
  );
};