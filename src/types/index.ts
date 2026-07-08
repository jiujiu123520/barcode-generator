export interface BarcodeParams {
  content: string;
  format: string;
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  bgColor?: string;
  margin?: number;
  output?: 'png' | 'svg' | 'pdf';
}

export interface BatchItem {
  id: string;
  content: string;
  status: 'pending' | 'generated' | 'error';
  data?: string;
  error?: string;
}

export interface BarcodeFormat {
  value: string;
  label: string;
  description: string;
}

export type BarcodeType = 'qrcode' | 'barcode';

export interface LabelElement {
  id: string;
  type: 'text' | 'qrcode' | 'barcode' | 'image' | 'line' | 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  format?: string;
  color?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  lineColor?: string;
  displayValue?: boolean;
  textAlign?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  elements: LabelElement[];
}