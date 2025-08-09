import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Package, 
  TrendingUp, 
  DollarSign,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';
import api from '@/services/api';
import { Navigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  corporate_name: string;
  cnpj: string;
  email: string;
  status: string;
  plan_type: string;
  created_at: string;
  user_count: number;
  revenue: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_branches: number;
  active_companies: number;
}

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
  active_subscriptions: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [masterCompanyId, setMasterCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

    fetchMasterCompanyId();
  }, []);

  // Verificar se é admin master (apenas para empresa master)
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  // Verificar se é admin da empresa master
  if (!isLoadingMasterCompany && (!masterCompanyId || user.company_id !== masterCompanyId)) {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    // Carregar dados do painel administrativo
    if (masterCompanyId) {
      loadAdminData();
    }
  }, [masterCompanyId]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Por enquanto, usar dados mockados para demonstração
      // TODO: Implementar chamadas reais da API quando estiver pronta
      setStats({
        totalCompanies: 26,
        activeCompanies: 24,
        totalRevenue: 5247.00,
        totalUsers: 156
      });

      setCompanies([
        {
          id: '1',
          name: 'Empresa ABC Ltda',
          corporate_name: 'Empresa ABC Comércio e Serviços Ltda',
          cnpj: '12.345.678/0001-90',
          email: 'contato@empresaabc.com',
          status: 'active',
          plan_type: 'Profissional',
          created_at: '2024-01-15',
          user_count: 8,
          revenue: 199.00
        },
        {
          id: '2',
          name: 'Tech Solutions',
          corporate_name: 'Tech Solutions Tecnologia Ltda',
          cnpj: '98.765.432/0001-10',
          email: 'admin@techsolutions.com',
          status: 'active',
          plan_type: 'Empresarial',
          created_at: '2024-02-20',
          user_count: 25,
          revenue: 399.00
        }
      ]);

      setPlans([
        {
          id: '1',
          name: 'Básico',
          description: 'Plano básico para pequenas empresas',
          price: 99.00,
          billing_cycle: 'monthly',
          max_users: 3,
          max_branches: 1,
          active_companies: 15
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Plano profissional para empresas em crescimento',
          price: 199.00,
          billing_cycle: 'monthly',
          max_users: 10,
          max_branches: 3,
          active_companies: 8
        },
        {
          id: '3',
          name: 'Empresarial',
          description: 'Plano empresarial para grandes empresas',
          price: 399.00,
          billing_cycle: 'monthly',
          max_users: 50,
          max_branches: 10,
          active_companies: 3
        }
      ]);

      setModules([
        {
          id: '1',
          name: 'Fluxo de Caixa',
          code: 'cash_flow',
          description: 'Controle de fluxo de caixa e movimentações financeiras',
          price: 79.00,
          category: 'finance',
          active_subscriptions: 12
        },
        {
          id: '2',
          name: 'Gestão de Estoque',
          code: 'inventory',
          description: 'Controle de estoque e movimentações',
          price: 49.00,
          category: 'inventory',
          active_subscriptions: 18
        },
        {
          id: '3',
          name: 'Marketplace',
          code: 'marketplace',
          description: 'Integração com marketplaces',
          price: 69.00,
          category: 'sales',
          active_subscriptions: 5
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error);
      // Usar dados de fallback em caso de erro
      setStats({
        totalCompanies: 0,
        activeCompanies: 0,
        totalRevenue: 0,
        totalUsers: 0
      });
      setCompanies([]);
      setPlans([]);
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados administrativos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gestão completa do sistema SaaS FinanceMax</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Master Admin
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
                             {stats.activeCompanies || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stats.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              +5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gerenciar Empresas</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </div>

          <div className="grid gap-4">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{company.name}</h3>
                        {getStatusBadge(company.status)}
                      </div>
                      <p className="text-sm text-gray-600">{company.corporate_name}</p>
                      <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Plano: {company.plan_type}</span>
                        <span>Usuários: {company.user_count}</span>
                        <span>Receita: R$ {company.revenue}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Suspender
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gerenciar Planos</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <Badge variant="outline">R$ {plan.price}/mês</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Máx. Usuários: {plan.max_users}</span>
                        <span>Máx. Filiais: {plan.max_branches}</span>
                        <span>Empresas Ativas: {plan.active_companies}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gerenciar Módulos</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </div>

          <div className="grid gap-4">
            {modules.map((module) => (
              <Card key={module.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{module.name}</h3>
                        <Badge variant="outline">R$ {module.price}/mês</Badge>
                        <Badge className="bg-blue-100 text-blue-800">{module.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{module.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Código: {module.code}</span>
                        <span>Assinaturas: {module.active_subscriptions}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Analytics e Relatórios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Plano</CardTitle>
                <CardDescription>Distribuição da receita mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Básico</span>
                    <span className="font-semibold">R$ 1.485</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profissional</span>
                    <span className="font-semibold">R$ 1.592</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empresarial</span>
                    <span className="font-semibold">R$ 1.197</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Módulos Mais Populares</CardTitle>
                <CardDescription>Módulos com mais assinaturas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gestão de Estoque</span>
                    <span className="font-semibold">18 assinaturas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fluxo de Caixa</span>
                    <span className="font-semibold">12 assinaturas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marketplace</span>
                    <span className="font-semibold">5 assinaturas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard; 