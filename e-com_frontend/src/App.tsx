import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import AuthRoutes from './routes/AuthRoutes';
import { store } from './store';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import GuestRoute from './components/auth/GuestRoute';
import Marketplace from './pages/Marketplace';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import { OrderDetails } from './pages/OrderDetails';
import { Wishlist } from './pages/Wishlist';
import Profile from './pages/Profile';
import AddressForm from './pages/AddressForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser default scroll restoration overriding
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Immediate scroll resets
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      document.body.scrollTop = 0;
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
    } catch (e) {
      window.scrollTo(0, 0);
    }

    // Delayed scroll resets to cover async DOM updates
    const timer = setTimeout(() => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
        document.body.scrollTop = 0;
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Marketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <ProductDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/address/new"
              element={
                <ProtectedRoute>
                  <AddressForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/address/edit/:id"
              element={
                <ProtectedRoute>
                  <AddressForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth/*"
              element={
                <GuestRoute>
                  <AuthRoutes />
                </GuestRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/create"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/:productId"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders/:orderId"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/customers"
              element={
                <AdminRoute>
                  <AdminCustomers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminInventory />
                </AdminRoute>
              }
            />
             <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategories mode="list" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories/create"
              element={
                <AdminRoute>
                  <AdminCategories mode="create" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories/:categoryId"
              element={
                <AdminRoute>
                  <AdminCategories mode="edit" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/coupons"
              element={
                <AdminRoute>
                  <AdminCoupons mode="list" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/coupons/create"
              element={
                <AdminRoute>
                  <AdminCoupons mode="create" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/coupons/:couponId"
              element={
                <AdminRoute>
                  <AdminCoupons mode="edit" />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
