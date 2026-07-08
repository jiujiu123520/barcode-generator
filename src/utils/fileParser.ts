export const parseCSV = (content: string): string[] => {
  const lines = content.split('\n');
  const results: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const values = trimmed.split(/[,;\t]/);
    for (const value of values) {
      const cleanValue = value.trim().replace(/^["']|["']$/g, '');
      if (cleanValue) {
        results.push(cleanValue);
      }
    }
  }
  
  return results;
};

export const parseTXT = (content: string): string[] => {
  const lines = content.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line);
};

export const parseFile = (content: string, filename: string): string[] => {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.endsWith('.csv')) {
    return parseCSV(content);
  }
  
  return parseTXT(content);
};