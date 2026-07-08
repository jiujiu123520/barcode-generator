export const downloadImage = (dataUrl: string, filename: string, format: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadSVG = (svgContent: string, filename: string): void => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadImage(url, filename, 'svg');
  URL.revokeObjectURL(url);
};

export const downloadPNG = (canvas: HTMLCanvasElement, filename: string): void => {
  const dataUrl = canvas.toDataURL('image/png');
  downloadImage(dataUrl, filename, 'png');
};

export const generateFilename = (content: string): string => {
  const maxLength = 50;
  const cleanContent = content
    .replace(/[\/:*?"<>|]/g, '_')
    .trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent || 'barcode';
  }
  
  return cleanContent.substring(0, maxLength) + '...';
};

export const downloadBatchAsZip = async (items: { filename: string; dataUrl: string }[]): Promise<void> => {
  const zip = document.createElement('a');
  const fragment = document.createDocumentFragment();
  
  items.forEach((item, index) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = item.filename;
    fragment.appendChild(link);
    
    setTimeout(() => {
      link.click();
    }, index * 100);
  });
  
  zip.appendChild(fragment);
  document.body.appendChild(zip);
  document.body.removeChild(zip);
};

export const downloadAllAsSingleFile = (items: { content: string; dataUrl: string }[], format: string): void => {
  if (format === 'png') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const itemHeight = 150;
    const itemWidth = 300;
    const padding = 20;
    
    canvas.width = itemWidth;
    canvas.height = items.length * itemHeight;
    
    items.forEach((item, index) => {
      const img = new Image();
      img.onload = () => {
        ctx!.drawImage(img, 0, index * itemHeight, itemWidth, itemHeight - padding);
        
        if (index === items.length - 1) {
          downloadPNG(canvas, 'all-barcodes');
        }
      };
      img.src = item.dataUrl;
    });
  } else {
    items.forEach((item, index) => {
      setTimeout(() => {
        downloadImage(item.dataUrl, generateFilename(item.content), format);
      }, index * 100);
    });
  }
};