import type { BarcodeFormat } from '@/types';

export const barcodeFormats: BarcodeFormat[] = [
  {
    value: 'CODE128',
    label: 'Code 128',
    description: '高密度条码，支持所有 ASCII 字符，最常用',
  },
  {
    value: 'CODE128A',
    label: 'Code 128A',
    description: '支持大写字母、数字和控制字符',
  },
  {
    value: 'CODE128B',
    label: 'Code 128B',
    description: '支持大小写字母和数字',
  },
  {
    value: 'CODE128C',
    label: 'Code 128C',
    description: '仅支持数字对，密度最高',
  },
  {
    value: 'CODE39',
    label: 'Code 39',
    description: '工业标准条码，支持字母数字和特殊字符',
  },
  {
    value: 'CODE39E',
    label: 'Code 39 Extended',
    description: '扩展版，支持全部 ASCII 字符',
  },
  {
    value: 'EAN13',
    label: 'EAN-13',
    description: '欧洲商品条码，13位数字',
  },
  {
    value: 'EAN8',
    label: 'EAN-8',
    description: '缩短版 EAN，8位数字',
  },
  {
    value: 'UPC',
    label: 'UPC-A',
    description: '美国商品条码，12位数字',
  },
  {
    value: 'UPCE',
    label: 'UPC-E',
    description: '缩短版 UPC，6位数字',
  },
  {
    value: 'ITF',
    label: 'ITF-14',
    description: '交叉二五码，用于物流包装，14位数字',
  },
  {
    value: 'ITF14',
    label: 'ITF-14 GS1',
    description: 'GS1 标准 ITF-14 条码',
  },
  {
    value: 'CODABAR',
    label: 'Codabar',
    description: '库德巴码，用于图书馆、血库和航空',
  },
  {
    value: 'MSI',
    label: 'MSI Plessey',
    description: '用于零售价格标签和仓储',
  },
  {
    value: 'PHARMA',
    label: 'Pharmacode',
    description: '药品包装条码',
  },
  {
    value: 'PHARMA2T',
    label: 'Pharmacode Two-Track',
    description: '双轨药品条码',
  },
];