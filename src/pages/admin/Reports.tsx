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
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Loader2,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
  type: string;
  lastGenerated?: string;
  status: 'ready' | 'generating' | 'error';
  size?: string;
  format: string;
}

interface ReportData {
  revenueReport: Array<{
    month: string;
    revenue: number;
    growth: number;
    companies: number;
  }>;
  userReport: Array<{
    company: string;
    users: number;
    activeUsers: number;
    lastActivity: string;
  }>;
  moduleReport: Array<{
    module: string;
    subscriptions: number;
    revenue: number;
    growth: number;
  }>;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('revenue');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadReports();
    loadReportData();
  }, [selectedReport, period]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Relatório de Receita',
          description: 'Análise detalhada da receita mensal e crescimento',
          type: 'revenue',
          lastGenerated: '2024-01-15T10:30:00Z',
          status: 'ready',
          size: '2.3 MB',
          format: 'PDF'
        },
        {
          id: '2',
          name: 'Relatório de Usuários',
          description: 'Estatísticas de usuários por empresa',
          type: 'users',
          lastGenerated: '2024-01-14T15:45:00Z',
          status: 'ready',
          size: '1.8 MB',
          format: 'Excel'
        },
        {
          id: '3',
          name: 'Relatório de Módulos',
          description: 'Performance dos módulos e assinaturas',
          type: 'modules',
          lastGenerated: '2024-01-13T09:15:00Z',
          status: 'ready',
          size: '1.2 MB',
          format: 'PDF'
        },
        {
          id: '4',
          name: 'Relatório de Empresas',
          description: 'Análise de empresas ativas e inativas',
          type: 'companies',
          status: 'generating',
          format: 'Excel'
        }
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const mockData: ReportData = {
        revenueReport: [
          { month: 'Jan', revenue: 3800, growth: 0, companies: 5 },
          { month: 'Fev', revenue: 4200, growth: 10.5, companies: 8 },
          { month: 'Mar', revenue: 4100, growth: -2.4, companies: 6 },
          { month: 'Abr', revenue: 4500, growth: 9.8, companies: 10 },
          { month: 'Mai', revenue: 4800, growth: 6.7, companies: 7 },
          { month: 'Jun', revenue: 4274, growth: -11.0, companies: 4 }
        ],
        userReport: [
          { company: 'Empresa ABC Ltda', users: 8, activeUsers: 7, lastActivity: '2024-01-15' },
          { company: 'Tech Solutions', users: 25, activeUsers: 22, lastActivity: '2024-01-15' },
          { company: 'Comércio XYZ', users: 3, activeUsers: 1, lastActivity: '2024-01-08' },
          { company: 'Indústria Delta', users: 45, activeUsers: 43, lastActivity: '2024-01-15' }
        ],
        moduleReport: [
          { module: 'Gestão de Estoque', subscriptions: 18, revenue: 882, growth: 12.3 },
          { module: 'Fluxo de Caixa', subscriptions: 12, revenue: 948, growth: 18.7 },
          { module: 'Contas a Receber', subscriptions: 10, revenue: 590, growth: 9.4 },
          { module: 'Contas a Pagar', subscriptions: 8, revenue: 472, growth: 5.2 },
          { module: 'Marketplace', subscriptions: 5, revenue: 345, growth: 15.8 },
          { module: 'Centro de Custos', subscriptions: 3, revenue: 267, growth: 8.1 }
        ]
      };

      setReportData(mockData);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      // Simular geração de relatório
      console.log(`Gerando relatório: ${reportType}`);
      
      setReports(prev => prev.map(report =>
        report.type === reportType ? { ...report, status: 'generating' } : report
      ));

      // Simular delay
      setTimeout(() => {
        setReports(prev => prev.map(report =>
          report.type === reportType ? { 
            ...report, 
            status: 'ready',
            lastGenerated: new Date().toISOString(),
            size: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} MB`
          } : report
        ));
      }, 3000);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReports(prev => prev.map(report =>
        report.type === reportType ? { ...report, status: 'error' } : report
      ));
    }
  };

  const downloadReport = (report: Report) => {
    // Simular download
    console.log(`Baixando relatório: ${report.name}`);
    alert(`Download iniciado: ${report.name}`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Pronto</Badge>;
      case 'generating':
        return <Badge className="bg-yellow-100 text-yellow-800">Gerando...</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Gere e visualize relatórios do sistema</p>
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
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {report.type === 'revenue' && <DollarSign className="h-5 w-5 text-green-600" />}
                  {report.type === 'users' && <Users className="h-5 w-5 text-blue-600" />}
                  {report.type === 'modules' && <BarChart3 className="h-5 w-5 text-purple-600" />}
                  {report.type === 'companies' && <Building2 className="h-5 w-5 text-orange-600" />}
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </div>
                {getStatusBadge(report.status)}
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.lastGenerated && (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  Última geração: {formatDate(report.lastGenerated)}
                </div>
              )}
              {report.size && (
                <div className="text-sm text-gray-500">
                  Tamanho: {report.size} | Formato: {report.format}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => generateReport(report.type)}
                  disabled={report.status === 'generating'}
                >
                  {report.status === 'generating' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  {report.status === 'generating' ? 'Gerando...' : 'Gerar'}
                </Button>
                {report.status === 'ready' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(report)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Visualizador de Relatórios</CardTitle>
              <CardDescription>Visualize os dados dos relatórios em tempo real</CardDescription>
            </div>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Relatório de Receita</SelectItem>
                <SelectItem value="users">Relatório de Usuários</SelectItem>
                <SelectItem value="modules">Relatório de Módulos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedReport === 'revenue' && reportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Receita Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.revenueReport.reduce((sum, item) => sum + item.revenue, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Crescimento Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage(reportData.revenueReport.reduce((sum, item) => sum + item.growth, 0) / reportData.revenueReport.length)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total de Empresas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.revenueReport.reduce((sum, item) => sum + item.companies, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Crescimento</TableHead>
                    <TableHead>Empresas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.revenueReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={item.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(item.growth)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.companies}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedReport === 'users' && reportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total de Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.userReport.reduce((sum, item) => sum + item.users, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Usuários Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.userReport.reduce((sum, item) => sum + item.activeUsers, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Atividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((reportData.userReport.reduce((sum, item) => sum + item.activeUsers, 0) / reportData.userReport.reduce((sum, item) => sum + item.users, 0)) * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Total de Usuários</TableHead>
                    <TableHead>Usuários Ativos</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.userReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.company}</TableCell>
                      <TableCell>{item.users}</TableCell>
                      <TableCell>{item.activeUsers}</TableCell>
                      <TableCell>{item.lastActivity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedReport === 'modules' && reportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total de Assinaturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.moduleReport.reduce((sum, item) => sum + item.subscriptions, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Receita Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.moduleReport.reduce((sum, item) => sum + item.revenue, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Crescimento Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage(reportData.moduleReport.reduce((sum, item) => sum + item.growth, 0) / reportData.moduleReport.length)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Assinaturas</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Crescimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.moduleReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.module}</TableCell>
                      <TableCell>{item.subscriptions}</TableCell>
                      <TableCell>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={item.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(item.growth)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports; 