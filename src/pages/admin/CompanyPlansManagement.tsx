import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  CreditCard, 
  Users, 
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Edit,
  Eye,
  Plus,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';
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
  subscription_status?: string;
  trial_end_date?: string;
  billing_cycle?: string;
  total_price?: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_branches: number;
}

const CompanyPlansManagement = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCompany, setUpdatingCompany] = useState<string | null>(null);

  // Verificar se é admin master
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  const isMasterAdmin = user.company_id === '53b3051a-5d5f-4748-a475-b4447c49aeac';
  if (!isMasterAdmin) {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, planFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar empresas
      const companiesData = await adminAPI.getCompanies();
      setCompanies(companiesData);

      // Carregar planos disponíveis
      const plansData = await adminAPI.getPlans();
      setPlans(plansData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados mockados para demonstração
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
          revenue: 199.00,
          subscription_status: 'active',
          trial_end_date: '2024-02-15',
          billing_cycle: 'monthly',
          total_price: 199.00
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
          revenue: 399.00,
          subscription_status: 'trial',
          trial_end_date: '2024-03-20',
          billing_cycle: 'monthly',
          total_price: 399.00
        },
        {
          id: '3',
          name: 'Startup Inovação',
          corporate_name: 'Startup Inovação Ltda',
          cnpj: '11.222.333/0001-44',
          email: 'contato@startupinovacao.com',
          status: 'active',
          plan_type: 'Básico',
          created_at: '2024-03-10',
          user_count: 3,
          revenue: 99.00,
          subscription_status: 'active',
          trial_end_date: '2024-04-10',
          billing_cycle: 'monthly',
          total_price: 99.00
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
          max_branches: 1
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Plano profissional para empresas em crescimento',
          price: 199.00,
          billing_cycle: 'monthly',
          max_users: 10,
          max_branches: 3
        },
        {
          id: '3',
          name: 'Empresarial',
          description: 'Plano empresarial para grandes empresas',
          price: 399.00,
          billing_cycle: 'monthly',
          max_users: 50,
          max_branches: 10
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj.includes(searchTerm) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    // Filtro por plano
    if (planFilter !== 'all') {
      filtered = filtered.filter(company => company.plan_type === planFilter);
    }

    setFilteredCompanies(filtered);
  };

  const updateCompanyPlan = async (companyId: string, newPlanType: string) => {
    try {
      setUpdatingCompany(companyId);
      await adminAPI.updateCompanyPlan(companyId, newPlanType);
      
      // Atualizar lista local
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, plan_type: newPlanType }
          : company
      ));
    } catch (error) {
      console.error('Erro ao atualizar plano da empresa:', error);
    } finally {
      setUpdatingCompany(null);
    }
  };

  const updateCompanyStatus = async (companyId: string, newStatus: string) => {
    try {
      setUpdatingCompany(companyId);
      await adminAPI.updateCompanyStatus(companyId, newStatus);
      
      // Atualizar lista local
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, status: newStatus }
          : company
      ));
    } catch (error) {
      console.error('Erro ao atualizar status da empresa:', error);
    } finally {
      setUpdatingCompany(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanPrice = (planType: string) => {
    const plan = plans.find(p => p.name === planType);
    return plan ? plan.price : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Planos das Empresas</h1>
          <p className="text-gray-600">Controle os planos e assinaturas de todas as empresas</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              {companies.filter(c => c.status === 'active').length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(companies.reduce((sum, c) => sum + (c.revenue || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {formatCurrency(companies.length > 0 ? companies.reduce((sum, c) => sum + (c.revenue || 0), 0) / companies.length : 0)} por empresa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas em Trial</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.subscription_status === 'trial').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((companies.filter(c => c.subscription_status === 'trial').length / companies.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.length > 0 
                ? Math.round((companies.filter(c => c.subscription_status === 'active').length / companies.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {companies.filter(c => c.subscription_status === 'active').length} de {companies.length} convertidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, CNPJ, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Plano</label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os planos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas ({filteredCompanies.length})</CardTitle>
          <CardDescription>
            Gerencie os planos e assinaturas de todas as empresas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano Atual</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Trial até</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.corporate_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{company.cnpj}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">📧</span>
                      {company.email}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(company.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={company.plan_type}
                      onValueChange={(value) => updateCompanyPlan(company.id, value)}
                      disabled={updatingCompany === company.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.name}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {company.subscription_status && getSubscriptionStatusBadge(company.subscription_status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(company.total_price || getPlanPrice(company.plan_type))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {company.billing_cycle || 'Mensal'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {company.user_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.trial_end_date ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(company.trial_end_date)}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCompanyStatus(company.id, company.status === 'active' ? 'inactive' : 'active')}
                        disabled={updatingCompany === company.id}
                      >
                        {company.status === 'active' ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyPlansManagement; 