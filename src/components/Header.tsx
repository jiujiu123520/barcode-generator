import { QrCode, Menu, Globe } from 'lucide-react';
import type { BarcodeType } from '@/types';

interface HeaderProps {
  activeType: BarcodeType;
  onTypeChange: (type: BarcodeType) => void;
}

export const Header = ({ activeType, onTypeChange }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">多零标签</h1>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                标签模板
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                API
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                帮助
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                文章
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                更新日志
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-red-500 transition-colors">
                问题反馈
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Globe className="w-4 h-4" />
              <span>English</span>
            </button>
            <button className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors">
              授权码.支付
            </button>
            <button className="md:hidden p-2 text-gray-500 hover:text-gray-700">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};