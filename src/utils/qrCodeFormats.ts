import type { BarcodeFormat } from '@/types';

export const qrCodeFormats: BarcodeFormat[] = [
  {
    value: 'QRCODE',
    label: 'QR Code',
    description: '最常用的二维码格式，支持大量数据',
  },
  {
    value: 'QRCODE,M',
    label: 'QR Code (Micro)',
    description: '微型二维码，适用于少量数据',
  },
  {
    value: 'EAN13',
    label: 'EAN-13',
    description: '欧洲商品条码',
  },
  {
    value: 'EAN8',
    label: 'EAN-8',
    description: '缩短版欧洲商品条码',
  },
  {
    value: 'UPC',
    label: 'UPC-A',
    description: '美国商品条码',
  },
  {
    value: 'UPCE',
    label: 'UPC-E',
    description: '缩短版美国商品条码',
  },
  {
    value: 'CODE128',
    label: 'Code 128',
    description: '高密度条码，支持所有 ASCII 字符',
  },
  {
    value: 'CODE128A',
    label: 'Code 128A',
    description: 'Code 128 的子集，支持大写字母和控制字符',
  },
  {
    value: 'CODE128B',
    label: 'Code 128B',
    description: 'Code 128 的子集，支持大小写字母',
  },
  {
    value: 'CODE128C',
    label: 'Code 128C',
    description: 'Code 128 的子集，支持数字对',
  },
  {
    value: 'CODE39',
    label: 'Code 39',
    description: '工业标准条码，支持字母数字',
  },
  {
    value: 'CODE39E',
    label: 'Code 39 Extended',
    description: '扩展版 Code 39，支持更多字符',
  },
  {
    value: 'ITF',
    label: 'ITF-14',
    description: '交叉二五码，用于物流包装',
  },
  {
    value: 'ITF14',
    label: 'ITF-14 GS1',
    description: 'GS1 标准的 ITF-14',
  },
  {
    value: 'CODA',
    label: 'Codabar',
    description: '库德巴码，用于图书馆和血库',
  },
  {
    value: 'MSI',
    label: 'MSI Plessey',
    description: 'MSI 码，用于零售和仓储',
  },
  {
    value: 'MSI10',
    label: 'MSI Plessey (10)',
    description: 'MSI 码带校验位',
  },
  {
    value: 'MSI11',
    label: 'MSI Plessey (11)',
    description: 'MSI 码带不同校验位',
  },
  {
    value: 'MSI1010',
    label: 'MSI Plessey (10-10)',
    description: 'MSI 码带双重校验',
  },
  {
    value: 'MSI1110',
    label: 'MSI Plessey (11-10)',
    description: 'MSI 码带组合校验',
  },
];