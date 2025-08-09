import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [masterCompanyId, setMasterCompanyId] = useState<string | null>(null);
  const [isLoadingMasterCompany, setIsLoadingMasterCompany] = useState(true);

  // Buscar ID da empresa master
  useEffect(() => {
    const fetchMasterCompanyId = async () => {
      try {
        const response = await api.get('/api/v1/admin/master-company-id');
        setMasterCompanyId(response.data.master_company_id);
      } catch (error) {
        console.error('Erro ao buscar empresa master:', error);
        setMasterCompanyId(null);
      } finally {
        setIsLoadingMasterCompany(false);
      }
    };

    if (isAuthenticated && user) {
      fetchMasterCompanyId();
    } else {
      setIsLoadingMasterCompany(false);
    }
  }, [isAuthenticated, user]);

  // Verificar se está carregando
  if (isLoading || isLoadingMasterCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Verificar se é master admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  // Verificar se é da empresa master
  if (!masterCompanyId || user.company_id !== masterCompanyId) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute; 