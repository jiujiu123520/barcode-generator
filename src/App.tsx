import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Editor from '@/pages/Editor';
import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Templates from '@/pages/admin/Templates';
import Users from '@/pages/admin/Users';
import Stats from '@/pages/admin/Stats';
import Content from '@/pages/admin/Content';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/admin/login" element={<Login />} />
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="templates" element={<Templates />} />
            <Route path="users" element={<Users />} />
            <Route path="stats" element={<Stats />} />
            <Route path="content" element={<Content />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
