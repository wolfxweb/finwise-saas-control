import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  monthlyGrowth: number;
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  averageUsersPerCompany: number;
  topPlans: Array<{
    name: string;
    revenue: number;
    companies: number;
    growth: number;
  }>;
  topModules: Array<{
    name: string;
    revenue: number;
    subscriptions: number;
    growth: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  companyGrowth: Array<{
    month: string;
    newCompanies: number;
    churnRate: number;
  }>;
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      // Dados mockados para demonstração
      const mockData: AnalyticsData = {
        totalRevenue: 4274.00,
        monthlyGrowth: 12.5,
        totalCompanies: 26,
        activeCompanies: 24,
        totalUsers: 81,
        averageUsersPerCompany: 3.1,
        topPlans: [
          {
            name: 'Profissional',
            revenue: 1592.00,
            companies: 8,
            growth: 15.2
          },
          {
            name: 'Básico',
            revenue: 1485.00,
            companies: 15,
            growth: 8.7
          },
          {
            name: 'Empresarial',
            revenue: 1197.00,
            companies: 3,
            growth: 22.1
          }
        ],
        topModules: [
          {
            name: 'Gestão de Estoque',
            revenue: 882.00,
            subscriptions: 18,
            growth: 12.3
          },
          {
            name: 'Fluxo de Caixa',
            revenue: 948.00,
            subscriptions: 12,
            growth: 18.7
          },
          {
            name: 'Contas a Receber',
            revenue: 590.00,
            subscriptions: 10,
            growth: 9.4
          }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 3800, growth: 0 },
          { month: 'Fev', revenue: 4200, growth: 10.5 },
          { month: 'Mar', revenue: 4100, growth: -2.4 },
          { month: 'Abr', revenue: 4500, growth: 9.8 },
          { month: 'Mai', revenue: 4800, growth: 6.7 },
          { month: 'Jun', revenue: 4274, growth: -11.0 }
        ],
        companyGrowth: [
          { month: 'Jan', newCompanies: 5, churnRate: 0 },
          { month: 'Fev', newCompanies: 8, churnRate: 2.1 },
          { month: 'Mar', newCompanies: 6, churnRate: 1.8 },
          { month: 'Abr', newCompanies: 10, churnRate: 3.2 },
          { month: 'Mai', newCompanies: 7, churnRate: 2.5 },
          { month: 'Jun', newCompanies: 4, churnRate: 1.9 }
        ]
      };

      setData(mockData);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Métricas e insights do sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(data.monthlyGrowth)}
              <span className={`ml-1 ${getGrowthColor(data.monthlyGrowth)}`}>
                {formatPercentage(data.monthlyGrowth)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeCompanies}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-600">+{data.totalCompanies - data.activeCompanies}</span>
              <span className="ml-1">de {data.totalCompanies} total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Média de {data.averageUsersPerCompany} por empresa</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.activeCompanies / data.totalCompanies) * 100)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-600">Excelente</span>
              <span className="ml-1">retenção de clientes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyRevenue.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{item.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(item.revenue / Math.max(...data.monthlyRevenue.map(r => r.revenue))) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.revenue)}</div>
                    <div className={`text-xs ${getGrowthColor(item.growth)}`}>
                      {formatPercentage(item.growth)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Empresas</CardTitle>
            <CardDescription>Novas empresas e taxa de churn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.companyGrowth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{item.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(item.newCompanies / Math.max(...data.companyGrowth.map(c => c.newCompanies))) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">+{item.newCompanies}</div>
                    <div className="text-xs text-red-600">
                      {item.churnRate}% churn
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Mais Populares</CardTitle>
            <CardDescription>Receita e crescimento por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPlans.map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.companies} empresas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(plan.revenue)}</div>
                    <div className={`text-xs ${getGrowthColor(plan.growth)}`}>
                      {formatPercentage(plan.growth)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos Mais Utilizados</CardTitle>
            <CardDescription>Receita e assinaturas por módulo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topModules.map((module, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-gray-500">{module.subscriptions} assinaturas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(module.revenue)}</div>
                    <div className={`text-xs ${getGrowthColor(module.growth)}`}>
                      {formatPercentage(module.growth)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Detalhadas</CardTitle>
          <CardDescription>Visão completa de todas as métricas do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Valor Atual</TableHead>
                  <TableHead>Crescimento</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Receita Mensal</TableCell>
                  <TableCell>{formatCurrency(data.totalRevenue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getGrowthIcon(data.monthlyGrowth)}
                      <span className={`ml-1 ${getGrowthColor(data.monthlyGrowth)}`}>
                        {formatPercentage(data.monthlyGrowth)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(5000)}</TableCell>
                  <TableCell>
                    <Badge variant={data.totalRevenue >= 5000 ? "default" : "secondary"}>
                      {data.totalRevenue >= 5000 ? "Meta Atingida" : "Em Progresso"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Empresas Ativas</TableCell>
                  <TableCell>{data.activeCompanies}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="ml-1 text-green-600">+{data.totalCompanies - data.activeCompanies}</span>
                    </div>
                  </TableCell>
                  <TableCell>30</TableCell>
                  <TableCell>
                    <Badge variant={data.activeCompanies >= 30 ? "default" : "secondary"}>
                      {data.activeCompanies >= 30 ? "Meta Atingida" : "Em Progresso"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Usuários Totais</TableCell>
                  <TableCell>{data.totalUsers}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="ml-1 text-green-600">+{Math.round(data.totalUsers * 0.1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>
                    <Badge variant={data.totalUsers >= 100 ? "default" : "secondary"}>
                      {data.totalUsers >= 100 ? "Meta Atingida" : "Em Progresso"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Taxa de Retenção</TableCell>
                  <TableCell>{Math.round((data.activeCompanies / data.totalCompanies) * 100)}%</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="ml-1 text-green-600">+5.2%</span>
                    </div>
                  </TableCell>
                  <TableCell>90%</TableCell>
                  <TableCell>
                    <Badge variant="default">Excelente</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics; 