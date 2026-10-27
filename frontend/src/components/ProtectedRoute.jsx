import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setVerified(false);
      return;
    }

    api.get('/auth/me')
      .then(() => setVerified(true))
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        setVerified(false);
      });
  }, []);

  if (verified === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm">Verifying secure admin session…</div>;
  }

  return verified ? children : <Navigate to="/admin/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
