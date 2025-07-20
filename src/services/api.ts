import axios from 'axios';

// Criar instância do axios
const apiUrl = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções de API para autenticação
export const authAPI = {
  login: async (email: string, password: string) => {
    // OAuth2 espera username e password como form data
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    const response = await api.post('/api/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
  },

  registerCompany: async (registrationData: any) => {
    const response = await api.post('/api/v1/auth/register-company', registrationData);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  refresh: async () => {
    const response = await api.post('/api/v1/auth/refresh');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/v1/auth/logout');
    return response.data;
  }
};

// Funções de API para empresas
export const companyAPI = {
  getProfile: async () => {
    const response = await api.get('/api/v1/company/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/api/v1/company/profile', data);
    return response.data;
  },

  getBranches: async () => {
    const response = await api.get('/api/v1/company/branches');
    return response.data;
  },

  createBranch: async (data: any) => {
    const response = await api.post('/api/v1/company/branches', data);
    return response.data;
  }
};

// Funções de API para usuários
export const userAPI = {
  getUsers: async () => {
    const response = await api.get('/api/v1/users');
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post('/api/v1/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/api/v1/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/api/v1/users/${id}`);
    return response.data;
  }
};

// Funções de API para módulos
export const moduleAPI = {
  getModules: async () => {
    const response = await api.get('/api/v1/modules');
    return response.data;
  },

  subscribeModule: async (moduleId: string) => {
    const response = await api.post(`/api/v1/modules/${moduleId}/subscribe`);
    return response.data;
  },

  unsubscribeModule: async (moduleId: string) => {
    const response = await api.post(`/api/v1/modules/${moduleId}/unsubscribe`);
    return response.data;
  }
};

// Funções de API para administração
export const adminAPI = {
  getStats: async () => {
    const response = await api.get('/api/v1/admin/stats');
    return response.data;
  },

  getCompanies: async () => {
    const response = await api.get('/api/v1/admin/companies');
    return response.data;
  },

  getCompanyDetail: async (companyId: string) => {
    const response = await api.get(`/api/v1/admin/companies/${companyId}`);
    return response.data;
  },

  getPlans: async () => {
    const response = await api.get('/api/v1/admin/plans');
    return response.data;
  },

  getModules: async () => {
    const response = await api.get('/api/v1/admin/modules');
    return response.data;
  },

  updateCompanyStatus: async (companyId: string, status: string) => {
    const response = await api.put(`/api/v1/admin/companies/${companyId}/status?status=${status}`);
    return response.data;
  },

  subscribeCompanyToModule: async (companyId: string, moduleId: string) => {
    const response = await api.post(`/api/v1/admin/companies/${companyId}/modules/${moduleId}/subscribe`);
    return response.data;
  },

  unsubscribeCompanyFromModule: async (companyId: string, moduleId: string) => {
    const response = await api.post(`/api/v1/admin/companies/${companyId}/modules/${moduleId}/unsubscribe`);
    return response.data;
  }
};

export default api; 