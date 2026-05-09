import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout.jsx';
import Home from './pages/Home.jsx';
import DynamicPage from './pages/DynamicPage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPages from './pages/AdminPages.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminPageProducts from './pages/AdminPageProducts.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/p/:slug" element={<DynamicPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/pages" replace />} />
        <Route path="/admin/pages" element={<AdminPages />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/pages/:id/products" element={<AdminPageProducts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
