import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';
import { Navigate } from 'react-router-dom';

interface BillingSummary {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_revenue: string;
  pending_revenue: string;
  overdue_revenue: string;
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

const BillingManagement = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);

  // Verificar se é admin master
  if (!user || user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  const isMasterAdmin = user.company_id === '53b3051a-5d5f-4748-a475-b4447c49aeac';
  if (!isMasterAdmin) {
    return <Navigate to="/app" replace />;
  }

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar resumo financeiro
      const summaryData = await adminAPI.getBillingSummary();
      setSummary(summaryData);

      // Carregar faturas recentes
      const invoicesData = await adminAPI.getRecentInvoices();
      setInvoices(invoicesData);

      // Carregar faturas vencidas
      const overdueData = await adminAPI.getOverdueInvoices();
      setOverdueInvoices(overdueData);

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
        overdue_revenue: "2394.00"
      });

      setInvoices([
        {
          id: '1',
          invoice_number: '2024120001',
          company_name: 'Empresa ABC Ltda',
          company_id: '1',
          total_amount: '199.00',
          status: 'paid',
          due_date: '2024-12-01',
          issue_date: '2024-11-01',
          payment_date: '2024-11-28'
        },
        {
          id: '2',
          invoice_number: '2024120002',
          company_name: 'Tech Solutions',
          company_id: '2',
          total_amount: '399.00',
          status: 'pending',
          due_date: '2024-12-01',
          issue_date: '2024-11-01'
        },
        {
          id: '3',
          invoice_number: '2024110001',
          company_name: 'Consultoria XYZ',
          company_id: '3',
          total_amount: '299.00',
          status: 'overdue',
          due_date: '2024-11-01',
          issue_date: '2024-10-01'
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

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
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

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Vencidas ({overdueInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>
                Últimas faturas geradas e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{invoice.company_name}</TableCell>
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
      </Tabs>
    </div>
  );
};

export default BillingManagement; 