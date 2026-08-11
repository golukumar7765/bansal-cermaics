import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  return localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/admin/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
