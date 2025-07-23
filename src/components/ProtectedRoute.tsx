import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredModules?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredModules = []
}) => {
  const { user, company, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  console.log('🔍 ProtectedRoute - Status:', {
    isLoading,
    isAuthenticated,
    user: !!user,
    company: !!company,
    requiredModules,
    requiredPermissions
  });

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se a empresa está ativa
  if (company && company.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Conta Suspensa
            </h2>
            <p className="text-yellow-700 mb-4">
              Sua conta está temporariamente suspensa. Entre em contato com o suporte para mais informações.
            </p>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
            >
              Contatar Suporte
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permissões específicas
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      user?.permissions.includes(permission)
    );

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Acesso Negado
              </h2>
              <p className="text-red-700">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar módulos específicos
  if (requiredModules.length > 0) {
    const hasModule = requiredModules.some(module =>
      company?.modules.includes(module)
    );

    if (!hasModule) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Módulo Não Disponível
              </h2>
              <p className="text-blue-700 mb-4">
                Este módulo não está incluído no seu plano atual.
              </p>
              <button
                onClick={() => window.location.href = '/register'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Atualizar Plano
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
}; 