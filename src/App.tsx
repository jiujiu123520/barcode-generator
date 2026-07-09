import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BarcodeBatch from '@/pages/BarcodeBatch';
import QRCodeBatch from '@/pages/QRCodeBatch';
import Home from '@/pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/barcode" element={<BarcodeBatch />} />
        <Route path="/qrcode" element={<QRCodeBatch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;