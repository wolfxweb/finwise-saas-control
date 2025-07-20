import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string;
  company_name?: string;
  branch_id?: string;
  branch_name?: string;
  permissions?: string[];
}

interface Company {
  id: string;
  name: string;
  corporate_name: string;
  cnpj: string;
  status: string;
  plan_type: string;
  modules?: string[];
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token ao inicializar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await authAPI.login(email, password);

      // Verificar se a resposta tem a estrutura esperada
      if (!response || typeof response !== 'object') {
        console.error('Resposta de login inválida: não é um objeto');
        return false;
      }

      const { access_token, user: userData, permissions, modules } = response;

      // Verificar se userData existe
      if (!userData) {
        console.error('Resposta de login inválida: userData não encontrado');
        return false;
      }

      // Salvar token
      localStorage.setItem('auth_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Garantir que as propriedades existam
      const userWithDefaults = {
        ...userData,
        permissions: permissions || [],
        company_name: userData.company_name || ''
      };
      
      // Atualizar estado
      setUser(userWithDefaults);
      
      // Salvar usuário no localStorage
      localStorage.setItem('user', JSON.stringify(userWithDefaults));
      
      // Buscar dados da empresa separadamente (apenas se não for admin master)
      if (userData.company_id && userData.company_id !== '53b3051a-5d5f-4748-a475-b4447c49aeac') {
        try {
          const companyResponse = await api.get(`/api/v1/company/profile`);
          const companyData = companyResponse.data;
          setCompany({
            ...companyData,
            modules: modules || []
          });
        } catch (companyError) {
          console.error('Erro ao buscar dados da empresa:', companyError);
          setCompany(null);
        }
      } else {
        // Para admin master, definir empresa como null
        setCompany(null);
      }

      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Remover token
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];

    // Limpar estado
    setUser(null);
    setCompany(null);
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      const userData = response.data;
      
      // Verificar se userData existe
      if (!userData) {
        console.error('Resposta de refresh inválida: userData não encontrado');
        logout();
        return;
      }
      
      // Garantir que as propriedades existam
      const userWithDefaults = {
        ...userData,
        permissions: userData.permissions || [],
        company_name: userData.company_name || ''
      };
      
      setUser(userWithDefaults);
      
      // Salvar usuário no localStorage
      localStorage.setItem('user', JSON.stringify(userWithDefaults));
      
      // Buscar dados da empresa separadamente (apenas se não for admin master)
      if (userData.company_id && userData.company_id !== '53b3051a-5d5f-4748-a475-b4447c49aeac') {
        try {
          const companyResponse = await api.get(`/api/v1/company/profile`);
          const companyData = companyResponse.data;
          setCompany({
            ...companyData,
            modules: companyData.modules || []
          });
        } catch (companyError) {
          console.error('Erro ao buscar dados da empresa:', companyError);
          setCompany(null);
        }
      } else {
        // Para admin master, definir empresa como null
        setCompany(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      logout(); // Token inválido, fazer logout
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    company,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 