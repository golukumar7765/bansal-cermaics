import React from 'react';

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import TechnicalsPage from './pages/TechnicalsPage';

import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';
import AdminInquiries from './pages/AdminInquiries';
import AdminOrders from './pages/AdminOrders';

import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

import CustomerOrderTracking from './pages/CustomerOrderTracking';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >

      <Navbar />

      <Routes>

        {/* =========================
            PUBLIC
        ========================== */}

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/category/:categoryName"
          element={<HomePage />}
        />

        <Route
          path="/products"
          element={<HomePage />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetailPage />}
        />

        <Route
          path="/technicals"
          element={<TechnicalsPage />}
        />

        <Route
          path="/contact"
          element={<ContactPage />}
        />

        <Route
          path="/cart"
          element={<CartPage />}
        />

        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />

        <Route
          path="/order-success"
          element={<OrderSuccessPage />}
        />

        {/* CUSTOMER ORDER TRACKING */}

        <Route
          path="/track-order"
          element={
            <CustomerOrderTracking />
          }
        />

        {/* =========================
            ADMIN LOGIN
        ========================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* =========================
            ADMIN DASHBOARD
        ========================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ADMIN RFQ
        ========================== */}

        <Route
          path="/admin/inquiries"
          element={
            <ProtectedRoute>
              <AdminInquiries />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ADMIN ORDERS
        ========================== */}

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        {/* =========================
            404
        ========================== */}

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">

                <h1 className="text-5xl font-bold text-gray-800">
                  404
                </h1>

                <p className="mt-3 text-gray-500">
                  Page not found
                </p>

              </div>
            </div>
          }
        />

      </Routes>

      <Footer />

    </BrowserRouter>
  );
}

export default App;