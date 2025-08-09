import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  Search,
  Filter,
  Users,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';
import api from '@/services/api';
import { Navigate } from 'react-router-dom';

interface BillingSummary {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_revenue: string;
  pending_revenue: string;
  overdue_revenue: string;
  trial_companies: number;
  trial_revenue: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  company_name: string;
  company_id: string;
  total_amount: string;
  status: string;
  due_date: string;
  issue_date: string;
  payment_date?: string;
  company_email?: string;
  subscription_status?: string;
  trial_end_date?: string;
  is_future?: boolean;
}

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  company_name: string;
  company_id: string;
  total_amount: string;
  due_date: string;
  days_overdue: number;
  company_email: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  status: string;
  plan_type: string;
  subscription_status?: string;
  trial_end_date?: string;
  total_price?: number;
  user_count?: number;
}

interface MonthlyGroup {
  month: string;
  invoices: Invoice[];
  total_amount: number;
  count: number;
}

const BillingManagement = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [futureInvoices, setFutureInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [monthlyGroups, setMonthlyGroups] = useState<MonthlyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');

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

    fetchMasterCompanyId();
  }, []);

  // Verificar se é admin master
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  if (!isLoadingMasterCompany && (!masterCompanyId || user.company_id !== masterCompanyId)) {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, futureInvoices, statusFilter, monthFilter, searchTerm, companyFilter]);

  const applyFilters = () => {
    // Combinar faturas atuais e futuras
    let filtered = [...invoices, ...futureInvoices];

    // Filtro por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        const today = new Date();
        filtered = filtered.filter(invoice => 
          invoice.status === 'pending' && new Date(invoice.due_date) < today
        );
      } else if (statusFilter === 'trial') {
        filtered = filtered.filter(invoice => 
          invoice.subscription_status === 'trial'
        );
      } else if (statusFilter === 'future') {
        filtered = filtered.filter(invoice => 
          invoice.status === 'future' || invoice.is_future
        );
      } else {
        filtered = filtered.filter(invoice => invoice.status === statusFilter);
      }
    }

    // Filtro por mês
    if (monthFilter !== 'all') {
      filtered = filtered.filter(invoice => {
        const invoiceMonth = new Date(invoice.due_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return invoiceMonth === monthFilter;
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.includes(searchTerm) ||
        (invoice.company_email && invoice.company_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por empresa
    if (companyFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.company_id === companyFilter);
    }

    setFilteredInvoices(filtered);
    groupInvoicesByMonth(filtered);
  };

  const groupInvoicesByMonth = (invoiceList: Invoice[]) => {
    const groups: { [key: string]: Invoice[] } = {};
    
    invoiceList.forEach(invoice => {
      const month = new Date(invoice.due_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(invoice);
    });

    const monthlyGroupsArray: MonthlyGroup[] = Object.entries(groups).map(([month, invoices]) => ({
      month,
      invoices,
      total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
      count: invoices.length
    }));

    setMonthlyGroups(monthlyGroupsArray.sort((a, b) => 
      new Date(a.invoices[0].due_date).getTime() - new Date(b.invoices[0].due_date).getTime()
    ));
  };

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar resumo financeiro
      const summaryData = await adminAPI.getBillingSummary();
      setSummary(summaryData);

      // Carregar faturas recentes
      const invoicesData = await adminAPI.getRecentInvoices();
      setInvoices(invoicesData);

      // Carregar faturas futuras
      const futureData = await adminAPI.getFutureInvoices();
      setFutureInvoices(futureData);

      // Carregar faturas vencidas
      const overdueData = await adminAPI.getOverdueInvoices();
      setOverdueInvoices(overdueData);

      // Carregar empresas
      const companiesData = await adminAPI.getCompanies();
      setCompanies(companiesData);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      // Dados mockados para demonstração
      setSummary({
        total_invoices: 156,
        paid_invoices: 142,
        pending_invoices: 8,
        overdue_invoices: 6,
        total_revenue: "52470.00",
        pending_revenue: "1592.00",
        overdue_revenue: "2394.00",
        trial_companies: 12,
        trial_revenue: "1188.00"
      });

      setInvoices([
        {
          id: '1',
          invoice_number: '2024120001',
          company_name: 'Empresa ABC Ltda',
          company_id: '2',
          total_amount: '199.00',
          status: 'paid',
          due_date: '2024-12-01',
          issue_date: '2024-11-01',
          payment_date: '2024-11-28',
          company_email: 'contato@empresaabc.com',
          subscription_status: 'active'
        },
        {
          id: '2',
          invoice_number: '2024120002',
          company_name: 'Tech Solutions',
          company_id: '3',
          total_amount: '399.00',
          status: 'pending',
          due_date: '2024-12-01',
          issue_date: '2024-11-01',
          company_email: 'admin@techsolutions.com',
          subscription_status: 'trial',
          trial_end_date: '2024-12-20'
        },
        {
          id: '3',
          invoice_number: '2024110001',
          company_name: 'Consultoria XYZ',
          company_id: '4',
          total_amount: '299.00',
          status: 'overdue',
          due_date: '2024-11-01',
          issue_date: '2024-10-01',
          company_email: 'contato@consultoriaxyz.com',
          subscription_status: 'active'
        },
        {
          id: '4',
          invoice_number: '2024120003',
          company_name: 'Startup Inovação',
          company_id: '5',
          total_amount: '99.00',
          status: 'pending',
          due_date: '2024-12-15',
          issue_date: '2024-11-15',
          company_email: 'admin@startupinovacao.com',
          subscription_status: 'trial',
          trial_end_date: '2024-12-15'
        },
        {
          id: '5',
          invoice_number: '2024120004',
          company_name: 'Maria',
          company_id: '6',
          total_amount: '149.00',
          status: 'pending',
          due_date: '2024-12-20',
          issue_date: '2024-11-20',
          company_email: 'maria@empresa.com',
          subscription_status: 'active'
        }
      ]);

      setFutureInvoices([
        {
          id: 'future_1',
          invoice_number: 'FUT202501001',
          company_name: 'Empresa ABC Ltda',
          company_id: '2',
          total_amount: '199.00',
          status: 'future',
          due_date: '2025-01-15',
          issue_date: '2025-01-01',
          payment_date: null,
          company_email: 'contato@empresaabc.com',
          is_future: true
        },
        {
          id: 'future_2',
          invoice_number: 'FUT202501002',
          company_name: 'Tech Solutions',
          company_id: '3',
          total_amount: '399.00',
          status: 'future',
          due_date: '2025-01-15',
          issue_date: '2025-01-01',
          payment_date: null,
          company_email: 'admin@techsolutions.com',
          is_future: true
        },
        {
          id: 'future_3',
          invoice_number: 'FUT202501003',
          company_name: 'Maria',
          company_id: '6',
          total_amount: '149.00',
          status: 'future',
          due_date: '2025-01-15',
          issue_date: '2025-01-01',
          payment_date: null,
          company_email: 'maria@empresa.com',
          is_future: true
        }
      ]);

      setCompanies([
        {
          id: '2',
          name: 'Empresa ABC Ltda',
          email: 'contato@empresaabc.com',
          status: 'active',
          plan_type: 'Profissional',
          subscription_status: 'active',
          total_price: 199.00,
          user_count: 8
        },
        {
          id: '3',
          name: 'Tech Solutions',
          email: 'admin@techsolutions.com',
          status: 'active',
          plan_type: 'Empresarial',
          subscription_status: 'trial',
          trial_end_date: '2024-12-20',
          total_price: 399.00,
          user_count: 25
        },
        {
          id: '4',
          name: 'Consultoria XYZ',
          email: 'contato@consultoriaxyz.com',
          status: 'active',
          plan_type: 'Profissional',
          subscription_status: 'active',
          total_price: 299.00,
          user_count: 12
        },
        {
          id: '5',
          name: 'Startup Inovação',
          email: 'admin@startupinovacao.com',
          status: 'active',
          plan_type: 'Básico',
          subscription_status: 'trial',
          trial_end_date: '2024-12-15',
          total_price: 99.00,
          user_count: 3
        },
        {
          id: '6',
          name: 'Maria',
          email: 'maria@empresa.com',
          status: 'active',
          plan_type: 'Básico',
          subscription_status: 'active',
          total_price: 149.00,
          user_count: 5
        }
      ]);

      setOverdueInvoices([
        {
          id: '3',
          invoice_number: '2024110001',
          company_name: 'Consultoria XYZ',
          company_id: '3',
          total_amount: '299.00',
          due_date: '2024-11-01',
          days_overdue: 30,
          company_email: 'contato@consultoriaxyz.com'
        },
        {
          id: '4',
          invoice_number: '2024110002',
          company_name: 'Startup Inovação',
          company_id: '4',
          total_amount: '199.00',
          due_date: '2024-11-01',
          days_overdue: 30,
          company_email: 'admin@startupinovacao.com'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyInvoices = async () => {
    try {
      setIsGeneratingInvoices(true);
      await adminAPI.generateMonthlyInvoices();
      await loadBillingData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  const markInvoiceAsPaid = async (invoiceId: string) => {
    try {
      await adminAPI.markInvoiceAsPaid(invoiceId);
      await loadBillingData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paga</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600">Controle de cobranças e faturamento</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={generateMonthlyInvoices}
            disabled={isGeneratingInvoices}
            className="flex items-center"
          >
            {isGeneratingInvoices ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isGeneratingInvoices ? 'Gerando...' : 'Gerar Faturas'}
          </Button>
          <Button variant="outline" onClick={loadBillingData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_invoices} faturas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.pending_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.pending_invoices} faturas pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Vencida</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.overdue_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.overdue_invoices} faturas vencidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas em Trial</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.trial_companies}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(parseFloat(summary.trial_revenue || '0'))} em receita potencial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_invoices > 0 
                  ? Math.round((summary.paid_invoices / summary.total_invoices) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.paid_invoices} de {summary.total_invoices} pagas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Empresa, número da fatura..."
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
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="future">Futuras</SelectItem>
                  <SelectItem value="trial">Em Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Mês</label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {Array.from(new Set(invoices.map(inv => 
                    new Date(inv.due_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  ))).map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Empresa</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Faturas ({filteredInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Vencidas ({overdueInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="trial" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Em Trial ({companies.filter(c => c.subscription_status === 'trial').length})
          </TabsTrigger>
          <TabsTrigger value="future" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Futuras ({futureInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Agrupamento por Mês */}
          {monthlyGroups.map((group) => (
            <Card key={group.month}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{group.month}</span>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{group.count} faturas</Badge>
                    <span className="text-lg font-semibold">{formatCurrency(group.total_amount)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{invoice.company_name}</TableCell>
                        <TableCell>{invoice.company_email || '-'}</TableCell>
                        <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          {invoice.payment_date ? formatDate(invoice.payment_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markInvoiceAsPaid(invoice.id)}
                              disabled={invoice.status === 'paid'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Vencidas</CardTitle>
              <CardDescription>
                Faturas com pagamento em atraso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias em Atraso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{invoice.company_name}</TableCell>
                      <TableCell>{invoice.company_email}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {invoice.days_overdue} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markInvoiceAsPaid(invoice.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Futuras</CardTitle>
              <CardDescription>
                Faturas programadas para os próximos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {futureInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{invoice.company_name}</TableCell>
                      <TableCell>{invoice.company_email}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Futura
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas em Trial</CardTitle>
              <CardDescription>
                Empresas em período de teste que podem converter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Trial até</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.filter(c => c.subscription_status === 'trial').map((company) => {
                    const trialEnd = company.trial_end_date ? new Date(company.trial_end_date) : null;
                    const today = new Date();
                    const daysRemaining = trialEnd ? Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.email}</TableCell>
                        <TableCell>{company.plan_type}</TableCell>
                        <TableCell>{formatCurrency(company.total_price || 0)}</TableCell>
                        <TableCell>{company.user_count || 0}</TableCell>
                        <TableCell>{company.trial_end_date ? formatDate(company.trial_end_date) : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={daysRemaining <= 7 ? "destructive" : daysRemaining <= 15 ? "secondary" : "default"}>
                            {daysRemaining} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingManagement; 