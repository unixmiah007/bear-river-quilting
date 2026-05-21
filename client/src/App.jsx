import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout.jsx';
import Home from './pages/Home.jsx';
import DynamicPage from './pages/DynamicPage.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import CheckoutSuccess from './pages/CheckoutSuccess.jsx';
import Account from './pages/Account.jsx';
import About from './pages/About.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import ReturnPolicy from './pages/ReturnPolicy.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPages from './pages/AdminPages.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminPageProducts from './pages/AdminPageProducts.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/account" element={<Account />} />
        <Route path="/p/:slug" element={<DynamicPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/pages" replace />} />
        <Route path="/admin/pages" element={<AdminPages />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/pages/:id/products" element={<AdminPageProducts />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
