import React from 'react';

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SubcategoryPage from './pages/SubcategoryPage';
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
import AboutPage from './pages/AboutPage';
import ServiceSupportPage from './pages/ServiceSupportPage';
import ProtectedRoute from './components/ProtectedRoute';
// App.js ke top par import karo
import FaqPage from './pages/FaqPage';



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

        {/* Storefront entry points.  These URLs are shareable and SEO-friendly;
            the pages still use the existing B2B/B2C catalog data. */}
        <Route
          path="/scientific"
          element={<HomePage />}
        />

        <Route
          path="/lifestyle"
          element={<HomePage />}
        />

        <Route path="/scientific/category/:categoryName" element={<CategoryPage />} />
        <Route path="/scientific/category/:categoryName/:subcategoryName" element={<SubcategoryPage />} />
        <Route path="/lifestyle/category/:categoryName" element={<CategoryPage />} />
        <Route path="/lifestyle/category/:categoryName/:subcategoryName" element={<SubcategoryPage />} />
        <Route path="/scientific/product/:id" element={<ProductDetailPage />} />
        <Route path="/lifestyle/product/:id" element={<ProductDetailPage />} />

        <Route
          path="/category/:categoryName"
          element={<CategoryPage />}
        />

        <Route
          path="/category/:categoryName/:subcategoryName"
          element={<SubcategoryPage />}
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
          path="/service-support"
          element={<ServiceSupportPage />}
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
        <Route path="/about" element={<AboutPage />} />

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
<Route path="/faq" element={<FaqPage />} />

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
