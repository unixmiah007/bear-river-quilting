import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import RouteSuspenseFallback from './components/RouteSuspenseFallback.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const DynamicPage = lazy(() => import('./pages/DynamicPage.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy.jsx'));
const TypesOfQuilting = lazy(() => import('./pages/TypesOfQuilting.jsx'));
const Customize = lazy(() => import('./pages/Customize.jsx'));
const CustomizeSuccess = lazy(() => import('./pages/CustomizeSuccess.jsx'));
const LongArmQuilting = lazy(() => import('./pages/LongArmQuilting.jsx'));
const LongArmQuiltingSuccess = lazy(() => import('./pages/LongArmQuiltingSuccess.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminPages = lazy(() => import('./pages/AdminPages.jsx'));
const AdminProducts = lazy(() => import('./pages/AdminProducts.jsx'));
const AdminCategories = lazy(() => import('./pages/AdminCategories.jsx'));
const AdminPageProducts = lazy(() => import('./pages/AdminPageProducts.jsx'));
const AdminOrders = lazy(() => import('./pages/AdminOrders.jsx'));
const AdminCustomizeRequests = lazy(() => import('./pages/AdminCustomizeRequests.jsx'));
const AdminCommunication = lazy(() => import('./pages/AdminCommunication.jsx'));
const AdminCustomPayment = lazy(() => import('./pages/AdminCustomPayment.jsx'));
const AdminServiceRequests = lazy(() => import('./pages/AdminServiceRequests.jsx'));

function SuspenseRoute({ children }) {
  return <Suspense fallback={<RouteSuspenseFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route
          path="/"
          element={
            <SuspenseRoute>
              <Home />
            </SuspenseRoute>
          }
        />
        <Route
          path="/about"
          element={
            <SuspenseRoute>
              <About />
            </SuspenseRoute>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <SuspenseRoute>
              <PrivacyPolicy />
            </SuspenseRoute>
          }
        />
        <Route
          path="/return-policy"
          element={
            <SuspenseRoute>
              <ReturnPolicy />
            </SuspenseRoute>
          }
        />
        <Route
          path="/types-of-quilting"
          element={
            <SuspenseRoute>
              <TypesOfQuilting />
            </SuspenseRoute>
          }
        />
        <Route
          path="/customize"
          element={
            <SuspenseRoute>
              <Customize />
            </SuspenseRoute>
          }
        />
        <Route
          path="/customize/success"
          element={
            <SuspenseRoute>
              <CustomizeSuccess />
            </SuspenseRoute>
          }
        />
        <Route
          path="/long-arm-quilting"
          element={
            <SuspenseRoute>
              <LongArmQuilting />
            </SuspenseRoute>
          }
        />
        <Route
          path="/long-arm-quilting/success"
          element={
            <SuspenseRoute>
              <LongArmQuiltingSuccess />
            </SuspenseRoute>
          }
        />
        <Route
          path="/products"
          element={
            <SuspenseRoute>
              <Products />
            </SuspenseRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <SuspenseRoute>
              <ProductDetail />
            </SuspenseRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <SuspenseRoute>
              <Cart />
            </SuspenseRoute>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <SuspenseRoute>
              <CheckoutSuccess />
            </SuspenseRoute>
          }
        />
        <Route
          path="/account"
          element={
            <SuspenseRoute>
              <Account />
            </SuspenseRoute>
          }
        />
        <Route
          path="/p/:slug"
          element={
            <SuspenseRoute>
              <DynamicPage />
            </SuspenseRoute>
          }
        />
      </Route>
      <Route
        path="/admin/login"
        element={
          <SuspenseRoute>
            <AdminLogin />
          </SuspenseRoute>
        }
      />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <SuspenseRoute>
              <AdminDashboard />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/pages"
          element={
            <SuspenseRoute>
              <AdminPages />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <SuspenseRoute>
              <AdminProducts />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <SuspenseRoute>
              <AdminCategories />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <SuspenseRoute>
              <AdminOrders />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/communication"
          element={
            <SuspenseRoute>
              <AdminCommunication />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/customize-requests"
          element={
            <SuspenseRoute>
              <AdminCustomizeRequests />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/custom-payment"
          element={
            <SuspenseRoute>
              <AdminCustomPayment />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/service-requests"
          element={
            <SuspenseRoute>
              <AdminServiceRequests />
            </SuspenseRoute>
          }
        />
        <Route
          path="/admin/pages/:id/products"
          element={
            <SuspenseRoute>
              <AdminPageProducts />
            </SuspenseRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
