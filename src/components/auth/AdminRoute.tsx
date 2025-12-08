import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
      </div>
    );
  }

  // Jika bukan Admin, tendang ke Dashboard utama
  if (userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Jika Admin, silakan lanjut
  return <Outlet />;
};

export default AdminRoute;