import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Users, 
  Building2, 
  FileText, 
  Store, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PlanDetails {
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
  max_users: number;
  max_branches: number;
  max_invoices?: number;
  marketplace_sync_limit?: number;
  modules: string[];
  features: string[];
}

const PlanDetails = () => {
  const { company, user } = useAuth();
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState({
    users: 0,
    branches: 0,
    invoices: 0,
    marketplace_syncs: 0
  });

  useEffect(() => {
    loadPlanDetails();
  }, [company]);

  const loadPlanDetails = async () => {
    try {
      setIsLoading(true);
      
      // Simular carregamento dos detalhes do plano baseado no tipo de plano da empresa
      const planData = getPlanData(company?.plan_type || 'Básico');
      setPlanDetails(planData);
      
      // Simular dados de uso atual
      setCurrentUsage({
        users: 3, // Exemplo: 3 usuários ativos
        branches: 1, // Exemplo: 1 filial
        invoices: 45, // Exemplo: 45 notas fiscais este mês
        marketplace_syncs: 120 // Exemplo: 120 sincronizações este mês
      });
      
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanData = (planType: string): PlanDetails => {
    const plans = {
      'Básico': {
        name: 'Básico',
        price: 149.00,
        billing_cycle: 'monthly',
        description: 'Ideal para pequenas empresas que estão começando',
        max_users: 5,
        max_branches: 1,
        max_invoices: 100,
        marketplace_sync_limit: 500,
        modules: ['cash_flow', 'accounts_receivable', 'products', 'inventory'],
        features: [
          'Fluxo de Caixa',
          'Contas a Receber',
          'Gestão de Produtos',
          'Controle de Estoque',
          'Suporte por Email',
          'Backup Automático',
          'Relatórios Básicos'
        ]
      },
      'Profissional': {
        name: 'Profissional',
        price: 199.00,
        billing_cycle: 'monthly',
        description: 'Perfeito para empresas em crescimento',
        max_users: 10,
        max_branches: 3,
        max_invoices: 500,
        marketplace_sync_limit: 2000,
        modules: ['cash_flow', 'accounts_receivable', 'accounts_payable', 'cost_center', 'products', 'inventory', 'suppliers', 'purchases'],
        features: [
          'Todas as funcionalidades do Básico',
          'Contas a Pagar',
          'Centro de Custos',
          'Gestão de Fornecedores',
          'Controle de Compras',
          'Relatórios Avançados',
          'Suporte Prioritário'
        ]
      },
      'Empresarial': {
        name: 'Empresarial',
        price: 399.00,
        billing_cycle: 'monthly',
        description: 'Para grandes empresas com necessidades complexas',
        max_users: 50,
        max_branches: 10,
        max_invoices: 2000,
        marketplace_sync_limit: 10000,
        modules: ['cash_flow', 'accounts_receivable', 'accounts_payable', 'cost_center', 'products', 'inventory', 'suppliers', 'purchases', 'shipping', 'orders', 'marketplace', 'invoice', 'users', 'support'],
        features: [
          'Todas as funcionalidades do Profissional',
          'Expedição',
          'Gestão de Pedidos',
          'Integração com Marketplaces',
          'Notas Fiscais Eletrônicas',
          'Gestão de Usuários',
          'Atendimento ao Cliente',
          'API Personalizada',
          'Suporte 24/7'
        ]
      }
    };

    return plans[planType as keyof typeof plans] || plans['Básico'];
  };

  const getModuleIcon = (module: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      cash_flow: <CreditCard className="h-4 w-4" />,
      accounts_receivable: <CreditCard className="h-4 w-4" />,
      accounts_payable: <CreditCard className="h-4 w-4" />,
      cost_center: <Building2 className="h-4 w-4" />,
      products: <Package className="h-4 w-4" />,
      inventory: <Package className="h-4 w-4" />,
      suppliers: <Building2 className="h-4 w-4" />,
      purchases: <Package className="h-4 w-4" />,
      shipping: <Package className="h-4 w-4" />,
      orders: <FileText className="h-4 w-4" />,
      marketplace: <Store className="h-4 w-4" />,
      invoice: <FileText className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      support: <Users className="h-4 w-4" />
    };
    return icons[module] || <Package className="h-4 w-4" />;
  };

  const getModuleName = (module: string) => {
    const names: { [key: string]: string } = {
      cash_flow: 'Fluxo de Caixa',
      accounts_receivable: 'Contas a Receber',
      accounts_payable: 'Contas a Pagar',
      cost_center: 'Centro de Custos',
      products: 'Produtos',
      inventory: 'Estoque',
      suppliers: 'Fornecedores',
      purchases: 'Compras',
      shipping: 'Expedição',
      orders: 'Pedidos',
      marketplace: 'Marketplace',
      invoice: 'Nota Fiscal',
      users: 'Usuários',
      support: 'Atendimento'
    };
    return names[module] || module;
  };

  const calculateUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes do plano...</p>
        </div>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Plano não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Plano</h1>
          <p className="text-gray-600">
            Plano atual: <strong>{planDetails.name}</strong> - {company?.name}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          R$ {planDetails.price.toFixed(2)}/mês
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Plano */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumo do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {planDetails.name}
              </CardTitle>
              <CardDescription>{planDetails.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{planDetails.max_users}</div>
                    <div className="text-sm text-gray-600">Usuários Máximos</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{planDetails.max_branches}</div>
                    <div className="text-sm text-gray-600">Filiais Máximas</div>
                  </div>
                </div>
                
                {planDetails.max_invoices && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{planDetails.max_invoices.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Notas Fiscais/Mês</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Módulos Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle>Módulos Disponíveis</CardTitle>
              <CardDescription>
                Funcionalidades incluídas no seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planDetails.modules.map((module) => (
                  <div key={module} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium">{getModuleName(module)}</div>
                      <div className="text-sm text-gray-600">Incluído no plano</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recursos */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Incluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Uso Atual */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uso Atual</CardTitle>
              <CardDescription>
                Consumo dos recursos do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usuários */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Usuários</span>
                  <span className={`text-sm font-medium ${getUsageColor(calculateUsagePercentage(currentUsage.users, planDetails.max_users))}`}>
                    {currentUsage.users}/{planDetails.max_users}
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(currentUsage.users, planDetails.max_users)} 
                  className="h-2"
                />
              </div>

              {/* Filiais */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Filiais</span>
                  <span className={`text-sm font-medium ${getUsageColor(calculateUsagePercentage(currentUsage.branches, planDetails.max_branches))}`}>
                    {currentUsage.branches}/{planDetails.max_branches}
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(currentUsage.branches, planDetails.max_branches)} 
                  className="h-2"
                />
              </div>

              {/* Notas Fiscais */}
              {planDetails.max_invoices && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Notas Fiscais (Mês)</span>
                    <span className={`text-sm font-medium ${getUsageColor(calculateUsagePercentage(currentUsage.invoices, planDetails.max_invoices))}`}>
                      {currentUsage.invoices.toLocaleString()}/{planDetails.max_invoices.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={calculateUsagePercentage(currentUsage.invoices, planDetails.max_invoices)} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Sincronizações Marketplace */}
              {planDetails.marketplace_sync_limit && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sincronizações (Mês)</span>
                    <span className={`text-sm font-medium ${getUsageColor(calculateUsagePercentage(currentUsage.marketplace_syncs, planDetails.marketplace_sync_limit))}`}>
                      {currentUsage.marketplace_syncs.toLocaleString()}/{planDetails.marketplace_sync_limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={calculateUsagePercentage(currentUsage.marketplace_syncs, planDetails.marketplace_sync_limit)} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Solicitar Upgrade
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Ver Contrato
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlanDetails; 