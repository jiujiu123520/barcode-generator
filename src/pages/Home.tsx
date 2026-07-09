import { Link } from 'react-router-dom';
import { Barcode, QrCode, ArrowRight } from 'lucide-react';

const Home = () => {
  const tools = [
    {
      icon: Barcode,
      title: '批量条形码生成',
      description: '批量导入数据，快速生成条形码标签',
      path: '/barcode',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      icon: QrCode,
      title: '批量二维码生成',
      description: '批量导入数据，快速生成二维码标签',
      path: '/qrcode',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-6 text-white">
        <h1 className="text-xl font-semibold">多零标签</h1>
        <p className="text-sm mt-1 opacity-90">标签、条形码批量制作工具</p>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <p className="text-gray-500 text-sm mb-6">
          无须下载安装，在线直接使用，批量高效制作，矢量高清导出
        </p>

        {/* Tool Cards */}
        <div className="space-y-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-white`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{tool.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{tool.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>数据保存在本地浏览器，生成无限制，单次导入上限300条</p>
          <p className="mt-1">支持多种条形码格式：EAN-13、Code128、Code39、UPC-A 等</p>
        </div>
      </main>
    </div>
  );
};

export default Home;