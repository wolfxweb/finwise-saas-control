import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, Calendar, AlertTriangle, BarChart3, FileText, Settings, Target, DollarSign, Eye, Edit, ChevronLeft, ChevronRight, CalendarIcon, X, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import api from "@/services/api";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashFlowMovement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "entrada" | "saida";
  category?: string;
  account?: string;
  status: string;
  status_display: string;
  source: "receivable" | "payable";
  source_id: number;
  due_date?: string;
  paid_amount?: number;
  payment_date?: string;
  notes?: string;
  customer_supplier?: string;
  movement_type?: string; // Added for Contas a Pagar
  total_amount?: number; // Added for Contas a Pagar
  installment_number?: number; // Added for Contas a Pagar
  total_installments?: number; // Added for Contas a Pagar
}

interface CashFlowMovementsPaginated {
  movements: CashFlowMovement[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  current_page: number; // Added for Contas a Pagar
}

interface CashFlowSummary {
  total_entries: number;
  total_exits: number;
  current_balance: number;
  pending_receivables: number;
  pending_payables: number;
  overdue_receivables: number;
  overdue_payables: number;
}

interface CashFlowForecast {
  date: string;
  expected_balance: number;
  receivables: number;
  payables: number;
}

interface CategorySummary {
  category_id?: number;
  category_name: string;
  total_amount: number;
  percentage: number;
  count: number;
}

interface MonthlyData {
  month: string;
  entries: number;
  exits: number;
}

interface CategoriesSummary {
  entries: CategorySummary[];
  exits: CategorySummary[];
  total_entries: number;
  total_exits: number;
  monthly_data: MonthlyData[];
  chart_data: {
    pie_entries: Array<{name: string; value: number}>;
    pie_exits: Array<{name: string; value: number}>;
    line_data: Array<{month: string; entradas: number; saidas: number}>;
  };
}

interface FilterOptions {
  customers: Array<{id: string; name: string}>;
  suppliers: Array<{id: string; name: string}>;
  categories_receivable: Array<{id: number; name: string}>;
  categories_payable: Array<{id: number; name: string}>;
  accounts: Array<{id: number; name: string}>;
}

interface DREItem {
  description: string;
  value: number;
  percentage?: number;
  level: number;
}

interface DRESection {
  title: string;
  items: DREItem[];
  total: number;
  level: number;
}

interface DREResponse {
  period: string;
  sections: DRESection[];
  revenue_total: number;
  cost_total: number;
  gross_profit: number;
  operational_expenses_total: number;
  operational_result: number;
  financial_result: number;
  result_before_taxes: number;
  taxes: number;
  net_result: number;
}

export default function FluxoCaixa() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("movimentacoes");
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementsPaginated, setMovementsPaginated] = useState<CashFlowMovementsPaginated | null>(null);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast[]>([]);
  const [categoriesSummary, setCategoriesSummary] = useState<CategoriesSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [dreData, setDreData] = useState<DREResponse | null>(null);
  const [payablesByMonth, setPayablesByMonth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovement, setSelectedMovement] = useState<CashFlowMovement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtros
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerSupplierFilter, setCustomerSupplierFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filtros específicos da aba categorias
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>("");

  // Filtros específicos do DRE
  // (removido drePeriodFilter - agora usando filterMonth)
  
  // Filtro por mês
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Cores para gráficos
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#67b7dc'];

  const loadDRE = async () => {
    try {
      const params = new URLSearchParams();
      
      // Usar o filtro por mês
      if (filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        params.append('start_date', format(startOfMonth, 'yyyy-MM-dd'));
        params.append('end_date', format(endOfMonth, 'yyyy-MM-dd'));
      }
      
      const response = await api.get(`/api/v1/cash-flow/dre?${params}`);
      setDreData(response.data);
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
      toast.error('Erro ao carregar DRE');
    }
  };

  const loadMovements = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (movementTypeFilter) params.append('movement_type', movementTypeFilter);
      if (statusFilter) params.append('status_filter', statusFilter);
      if (customerSupplierFilter) params.append('customer_supplier_id', customerSupplierFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (accountFilter) params.append('account_id', accountFilter);
      if (startDate) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      
      // Filtro por mês - se não há datas customizadas, usar o mês selecionado
      if (!startDate && !endDate && filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        params.append('start_date', format(startOfMonth, 'yyyy-MM-dd'));
        params.append('end_date', format(endOfMonth, 'yyyy-MM-dd'));
      }
      
      const response = await api.get(`/api/v1/cash-flow/movements?${params}`);
      setMovementsPaginated(response.data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast.error('Erro ao carregar movimentações');
    }
  };

  const loadPayablesForContasTab = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        movement_type: 'saida' // Filtrar apenas saídas (contas a pagar)
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status_filter', statusFilter);
      if (customerSupplierFilter) params.append('customer_supplier_id', customerSupplierFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (accountFilter) params.append('account_id', accountFilter);
      if (startDate) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      
      // Filtro por mês - se não há datas customizadas, usar o mês selecionado
      if (!startDate && !endDate && filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        params.append('start_date', format(startOfMonth, 'yyyy-MM-dd'));
        params.append('end_date', format(endOfMonth, 'yyyy-MM-dd'));
      }
      
      const response = await api.get(`/api/v1/cash-flow/movements?${params}`);
      setMovementsPaginated(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast.error('Erro ao carregar contas a pagar');
    }
  };

  const loadCategoriesSummary = async () => {
    try {
      const params = new URLSearchParams();
      
      // Usar o filtro por mês
      if (filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        params.append('start_date', format(startOfMonth, 'yyyy-MM-dd'));
        params.append('end_date', format(endOfMonth, 'yyyy-MM-dd'));
      }
      
      if (categoryTypeFilter) params.append('category_filter', categoryTypeFilter);
      
      const response = await api.get(`/api/v1/cash-flow/categories-summary?${params}`);
      setCategoriesSummary(response.data);
    } catch (error) {
      console.error('Erro ao carregar resumo por categorias:', error);
      toast.error('Erro ao carregar resumo por categorias');
    }
  };

  const loadFilterOptions = async () => {
    try {
      console.log('🔄 Carregando opções de filtro...');
      const response = await api.get('/api/v1/cash-flow/filter-options');
      console.log('✅ Opções de filtro carregadas:', response.data);
      console.log('📊 Contas encontradas:', response.data.accounts?.length || 0);
      if (response.data.accounts) {
        response.data.accounts.forEach((account: any) => {
          console.log(`🏦 Conta: ${account.name} (ID: ${account.id})`);
        });
      }
      setFilterOptions(response.data);
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtro:', error);
      toast.error('Erro ao carregar opções de filtro');
    }
  };

  const loadCashFlowSummary = async () => {
    try {
      const params = new URLSearchParams();
      
      // Se há datas customizadas, usar elas; senão usar o mês selecionado
      if (startDate && endDate) {
        params.append('start_date', format(startDate, 'yyyy-MM-dd'));
        params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      } else if (filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        params.append('start_date', format(startOfMonth, 'yyyy-MM-dd'));
        params.append('end_date', format(endOfMonth, 'yyyy-MM-dd'));
      } else {
        params.append('period', 'current_month');
      }
      
      const summaryResponse = await api.get(`/api/v1/cash-flow/summary?${params}`);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Erro ao carregar resumo do fluxo de caixa:', error);
      toast.error('Erro ao carregar resumo do fluxo de caixa');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados em paralelo
      await Promise.all([
        loadMovements(),
        loadCategoriesSummary(),
        loadFilterOptions(),
        loadDRE(),
        loadPayablesByMonth(),
        loadCashFlowSummary()
      ]);
      
      // Carregar previsão
      const forecastResponse = await api.get('/api/v1/cash-flow/forecast?days_ahead=30');
      setForecast(forecastResponse.data);
      
    } catch (error) {
      console.error('Erro ao carregar dados do fluxo de caixa:', error);
      toast.error('Erro ao carregar dados do fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  const loadPayablesByMonth = async () => {
    try {
      // Gerar dados para 12 meses (2 anteriores + atual + 9 próximos) para mês atual ficar na 3ª posição
      const currentDate = new Date();
      const months = [];
      
      console.log('🔍 Carregando dados do gráfico por mês...');
      console.log('📅 Mês atual:', format(currentDate, 'MMM/yy', { locale: ptBR }));
      
      // Primeiro, vamos buscar todos os dados sem filtro de data para debug
      try {
        const allDataResponse = await api.get(`/api/v1/cash-flow/movements?movement_type=saida&limit=100`);
        console.log('📋 Todas as contas a pagar encontradas:', allDataResponse.data.movements?.length || 0);
        allDataResponse.data.movements?.forEach((movement: any) => {
          console.log(`📝 Conta: ${movement.description} - Vencimento: ${movement.due_date} - Valor: R$ ${movement.amount}`);
        });
      } catch (error) {
        console.error('Erro ao buscar todos os dados:', error);
      }
      
      // Gerar os meses (2 anteriores + atual + 9 próximos = 12 meses total)
      for (let i = -2; i <= 9; i++) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const startDate = format(monthDate, 'yyyy-MM-dd');
        const endDate = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), 'yyyy-MM-dd');
        
        console.log(`🗓️ Buscando dados para ${format(monthDate, 'MMM/yy')} (${startDate} a ${endDate})`);
        
        // Buscar dados do mês
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          movement_type: 'saida',
          limit: '100'
        });
        
        try {
          const response = await api.get(`/api/v1/cash-flow/movements?${params}`);
          const movements = response.data.movements || [];
          
          let total = 0;
          movements.forEach((movement: any) => {
            // Garantir que o valor seja numérico
            const amount = parseFloat(movement.amount) || 0;
            total += amount;
            console.log(`📊 Mês ${format(monthDate, 'MMM/yy')}: ${movement.description} (${movement.due_date}) = R$ ${amount.toFixed(2)}`);
          });
          
          console.log(`📈 Total do mês ${format(monthDate, 'MMM/yy')}: R$ ${total.toFixed(2)} (${movements.length} movimentações)`);
          
          months.push({
            month: format(monthDate, 'MMM/yy', { locale: ptBR }),
            total: total,
            isCurrentMonth: i === 0  // i === 0 significa mês atual (terceira posição)
          });
        } catch (error) {
          console.error(`Erro ao carregar dados do mês ${format(monthDate, 'MM/yyyy')}:`, error);
          months.push({
            month: format(monthDate, 'MMM/yy', { locale: ptBR }),
            total: 0,
            isCurrentMonth: i === 0
          });
        }
      }
      
      console.log('📊 Dados finais do gráfico:', months);
      console.log('🎯 Posição do mês atual:', months.findIndex(m => m.isCurrentMonth) + 1);
      setPayablesByMonth(months);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar por mês:', error);
      toast.error('Erro ao carregar dados do gráfico');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadMovements();
    }
  }, [currentPage, pageSize, searchTerm, movementTypeFilter, statusFilter, customerSupplierFilter, categoryFilter, accountFilter, startDate, endDate, filterMonth]);

  useEffect(() => {
    if (!loading && activeTab === "categorias") {
      loadCategoriesSummary();
    }
  }, [activeTab, filterMonth, categoryTypeFilter]);

  useEffect(() => {
    if (!loading && activeTab === "dre") {
      loadDRE();
    }
  }, [activeTab, filterMonth]);

  useEffect(() => {
    if (!loading && activeTab === "contas") {
      loadPayablesByMonth();
      loadPayablesForContasTab();
      loadFilterOptions(); // Adicionar carregamento das opções de filtro
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading && activeTab === "contas") {
      loadPayablesForContasTab();
    }
  }, [activeTab, currentPage, pageSize, searchTerm, statusFilter, customerSupplierFilter, categoryFilter, accountFilter, startDate, endDate, filterMonth]);

  useEffect(() => {
    if (!loading) {
      loadCashFlowSummary();
    }
  }, [startDate, endDate, filterMonth]);

  const handleViewMovement = (movement: CashFlowMovement) => {
    setSelectedMovement(movement);
    setIsMovementModalOpen(true);
  };

  const handleEditMovement = (movement: CashFlowMovement) => {
    // Redirecionar para a página apropriada baseada no source
    if (movement.source === 'receivable') {
      window.location.href = `/app/contas-receber?edit=${movement.source_id}`;
    } else {
      window.location.href = `/app/contas-pagar?edit=${movement.source_id}`;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'OVERDUE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadMovements();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMovementTypeFilter("");
    setStatusFilter("");
    setCustomerSupplierFilter("");
    setCategoryFilter("");
    setAccountFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterMonth(new Date().toISOString().slice(0, 7));
    setCurrentPage(1);
  };

  const clearCategoryFilters = () => {
    setCategoryTypeFilter("");
    setFilterMonth(new Date().toISOString().slice(0, 7));
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

  const getCustomerSupplierOptions = () => {
    if (!filterOptions) return [];
    
    const options = [];
    
    // Adicionar clientes
    filterOptions.customers.forEach(customer => {
      options.push({ id: customer.id, name: `${customer.name} (Cliente)` });
    });
    
    // Adicionar fornecedores
    filterOptions.suppliers.forEach(supplier => {
      options.push({ id: supplier.id, name: `${supplier.name} (Fornecedor)` });
    });
    
    return options;
  };

  const getCategoryOptions = () => {
    if (!filterOptions) return [];
    
    const options = [];
    
    // Adicionar categorias de entrada
    filterOptions.categories_receivable.forEach(category => {
      options.push({ id: category.id, name: `${category.name} (Entrada)` });
    });
    
    // Adicionar categorias de saída
    filterOptions.categories_payable.forEach(category => {
      options.push({ id: category.id, name: `${category.name} (Saída)` });
    });
    
    return options;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'current_month': return 'Mês Atual';
      case '3_months': return 'Últimos 3 Meses';
      case '6_months': return 'Últimos 6 Meses';
      case '12_months': return 'Últimos 12 Meses';
      case 'year': return 'Este Ano';
      default: return 'Período Personalizado';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando fluxo de caixa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Controle completo das movimentações financeiras</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {summary ? formatCurrency(summary.total_entries) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Total de contas a receber</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary ? formatCurrency(summary.total_exits) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Total de contas a pagar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {summary ? formatCurrency(summary.current_balance) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Saldo em caixa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão Próximo Mês</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {forecast.length > 0 ? formatCurrency(forecast[forecast.length - 1].expected_balance) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Cenário realista</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="movimentacoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Análise Entrada e Saída
          </TabsTrigger>
          <TabsTrigger value="dre" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            DRE
          </TabsTrigger>
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Contas R/P
          </TabsTrigger>
          <TabsTrigger value="previsao" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Previsão
          </TabsTrigger>
          <TabsTrigger value="capital" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Capital
          </TabsTrigger>
        </TabsList>

        {/* Aba: Movimentações */}
        <TabsContent value="movimentacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Financeiras</CardTitle>
              <CardDescription>
                {movementsPaginated ? 
                  `${movementsPaginated.total} movimentações encontradas` : 
                  'Histórico baseado em contas a receber e pagar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="space-y-4 mb-6">
                {/* Primeira linha de filtros */}
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar movimentações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex flex-col gap-1">
                      <Input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-[180px]"
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Vencimento Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Vencimento Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Segunda linha de filtros */}
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={customerSupplierFilter} onValueChange={setCustomerSupplierFilter}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Cliente/Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {getCustomerSupplierOptions().map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {getCategoryOptions().map((option) => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Conta/Cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      
                      {/* Contas Bancárias */}
                      {filterOptions?.accounts.filter(account => 
                        !account.name.includes('💳')
                      ).length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel>Contas Bancárias</SelectLabel>
                            {filterOptions.accounts
                              .filter(account => !account.name.includes('💳'))
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </>
                      )}
                      
                      {/* Cartões */}
                      {filterOptions?.accounts.filter(account => 
                        account.name.includes('💳')
                      ).length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel>Cartões</SelectLabel>
                            {filterOptions.accounts
                              .filter(account => account.name.includes('💳'))
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                  
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>

                {/* Indicadores de filtros ativos */}
                {(startDate || endDate || movementTypeFilter || statusFilter || customerSupplierFilter || categoryFilter || accountFilter || filterMonth !== new Date().toISOString().slice(0, 7)) && (
                  <div className="flex flex-wrap gap-2">
                    {startDate && (
                      <Badge variant="secondary">
                        Início: {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => setStartDate(undefined)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {endDate && (
                      <Badge variant="secondary">
                        Fim: {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => setEndDate(undefined)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filterMonth !== new Date().toISOString().slice(0, 7) && (
                      <Badge variant="secondary">
                        Mês: {new Date(filterMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => setFilterMonth(new Date().toISOString().slice(0, 7))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {movementTypeFilter && (
                      <Badge variant="secondary">
                        Tipo: {movementTypeFilter === "entrada" ? "Entradas" : "Saídas"}
                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => setMovementTypeFilter("")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {statusFilter && (
                      <Badge variant="secondary">
                        Status: {statusFilter === "PENDING" ? "Pendente" : statusFilter === "PAID" ? "Pago" : "Vencido"}
                        <Button variant="ghost" size="sm" className="ml-1 h-4 w-4 p-0" onClick={() => setStatusFilter("")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Tabela */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente/Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsPaginated?.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.description}</TableCell>
                        <TableCell>{movement.customer_supplier || '-'}</TableCell>
                        <TableCell>{movement.category || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.account || '-'}</TableCell>
                        <TableCell className={movement.type === "entrada" ? "text-success font-medium" : ""}>
                          {movement.type === "entrada" ? formatCurrency(movement.amount) : "-"}
                        </TableCell>
                        <TableCell className={movement.type === "saida" ? "text-destructive font-medium" : ""}>
                          {movement.type === "saida" ? formatCurrency(movement.amount) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(movement.status)}>
                            {movement.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {movement.due_date ? formatDate(movement.due_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewMovement(movement)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMovement(movement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {movementsPaginated && movementsPaginated.total_pages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((movementsPaginated.page - 1) * movementsPaginated.limit) + 1} a{' '}
                      {Math.min(movementsPaginated.page * movementsPaginated.limit, movementsPaginated.total)} de{' '}
                      {movementsPaginated.total} resultados
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(movementsPaginated.page - 1)}
                      disabled={movementsPaginated.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, movementsPaginated.total_pages) }, (_, i) => {
                        const pageNum = movementsPaginated.page <= 3 ? i + 1 : movementsPaginated.page - 2 + i;
                        if (pageNum > movementsPaginated.total_pages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === movementsPaginated.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(movementsPaginated.page + 1)}
                      disabled={movementsPaginated.page >= movementsPaginated.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Categorias */}
        <TabsContent value="categorias" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análise de Entrada e Saída</CardTitle>
                <CardDescription>Análise de entrada e saída</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="flex flex-col gap-1">
                  <Input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <Button variant="outline" onClick={clearCategoryFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Filtros */}
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="flex flex-col gap-1">
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-[180px]"
                    />
                  </div>
                  <Select value={categoryTypeFilter} onValueChange={setCategoryTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="receivable">Entradas</SelectItem>
                      <SelectItem value="payable">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={clearCategoryFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>

                {/* Totalizadores */}
                {categoriesSummary && (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-success">Total Entradas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-success">
                          {formatCurrency(categoriesSummary.total_entries)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Total Saídas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                          {formatCurrency(categoriesSummary.total_exits)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${
                          (categoriesSummary.total_entries - categoriesSummary.total_exits) >= 0 
                            ? 'text-success' 
                            : 'text-destructive'
                        }`}>
                          {formatCurrency(categoriesSummary.total_entries - categoriesSummary.total_exits)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tabela de Entradas */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-success">Categorias de Entrada</h3>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Percentual</TableHead>
                          <TableHead className="text-right">Qtd Movimentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoriesSummary?.entries.map((category) => (
                          <TableRow key={category.category_id || 'sem-categoria'}>
                            <TableCell className="font-medium">{category.category_name}</TableCell>
                            <TableCell className="text-right font-medium text-success">
                              {formatCurrency(category.total_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {category.count}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!categoriesSummary?.entries || categoriesSummary.entries.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Nenhuma entrada encontrada no período
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Tabela de Saídas */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-destructive">Categorias de Saída</h3>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Percentual</TableHead>
                          <TableHead className="text-right">Qtd Movimentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoriesSummary?.exits.map((category) => (
                          <TableRow key={category.category_id || 'sem-categoria'}>
                            <TableCell className="font-medium">{category.category_name}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {formatCurrency(category.total_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {category.count}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!categoriesSummary?.exits || categoriesSummary.exits.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Nenhuma saída encontrada no período
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Gráficos */}
                {categoriesSummary && (
                  <div className="space-y-6">
                    {/* Gráfico de Linha - Evolução Mensal */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Evolução Mensal - Entradas vs Saídas
                        </CardTitle>
                        <CardDescription>
                          Comparação da evolução das entradas e saídas por data de vencimento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {categoriesSummary?.chart_data?.line_data && categoriesSummary.chart_data.line_data.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={categoriesSummary.chart_data.line_data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis tickFormatter={(value) => formatCurrency(value || 0)} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="entradas" 
                                stroke="#22c55e" 
                                strokeWidth={3}
                                name="Entradas" 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="saidas" 
                                stroke="#ef4444" 
                                strokeWidth={3}
                                name="Saídas" 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>Nenhum dado mensal encontrado para o período selecionado</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gráficos de Pizza */}
                    <div className="grid gap-6 md:grid-cols-2">
                       {/* Gráfico de Pizza - Entradas */}
                       <Card>
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-success">
                             <PieChart className="h-5 w-5" />
                             Distribuição de Entradas por Categoria
                           </CardTitle>
                           <CardDescription>
                             Total: {categoriesSummary ? formatCurrency(categoriesSummary.total_entries) : 'R$ 0,00'}
                           </CardDescription>
                         </CardHeader>
                         <CardContent>
                           {categoriesSummary?.chart_data?.pie_entries && categoriesSummary.chart_data.pie_entries.length > 0 ? (
                             <ResponsiveContainer width="100%" height={350}>
                               <RechartsPieChart>
                                 <Pie
                                   data={categoriesSummary.chart_data.pie_entries}
                                   dataKey="value"
                                   nameKey="name"
                                   cx="50%"
                                   cy="50%"
                                   outerRadius={120}
                                   fill="#8884d8"
                                   label={({value, percent}) => {
                                     const percentage = percent || 0;
                                     return `${(percentage * 100).toFixed(1)}%`;
                                   }}
                                 >
                                   {categoriesSummary.chart_data.pie_entries.map((entry, index) => (
                                     <Cell key={`cell-entries-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                                 <Legend />
                               </RechartsPieChart>
                             </ResponsiveContainer>
                           ) : (
                             <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                               <div className="text-center">
                                 <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                 <p>Nenhum dado de entrada encontrado</p>
                               </div>
                             </div>
                           )}
                         </CardContent>
                       </Card>

                       {/* Gráfico de Pizza - Saídas */}
                       <Card>
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-destructive">
                             <PieChart className="h-5 w-5" />
                             Distribuição de Saídas por Categoria
                           </CardTitle>
                           <CardDescription>
                             Total: {categoriesSummary ? formatCurrency(categoriesSummary.total_exits) : 'R$ 0,00'}
                           </CardDescription>
                         </CardHeader>
                         <CardContent>
                           {categoriesSummary?.chart_data?.pie_exits && categoriesSummary.chart_data.pie_exits.length > 0 ? (
                             <ResponsiveContainer width="100%" height={350}>
                               <RechartsPieChart>
                                 <Pie
                                   data={categoriesSummary.chart_data.pie_exits}
                                   dataKey="value"
                                   nameKey="name"
                                   cx="50%"
                                   cy="50%"
                                   outerRadius={120}
                                   fill="#8884d8"
                                   label={({value, percent}) => {
                                     const percentage = percent || 0;
                                     return `${(percentage * 100).toFixed(1)}%`;
                                   }}
                                 >
                                   {categoriesSummary.chart_data.pie_exits.map((entry, index) => (
                                     <Cell key={`cell-exits-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                                 <Legend />
                               </RechartsPieChart>
                             </ResponsiveContainer>
                           ) : (
                             <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                               <div className="text-center">
                                 <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                 <p>Nenhum dado de saída encontrado</p>
                               </div>
                             </div>
                           )}
                         </CardContent>
                       </Card>
                    </div>
                  </div>
                )}


              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Contas a Receber e Pagar */}
        <TabsContent value="contas" className="space-y-6">
          <Tabs defaultValue="contas-pagar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contas-pagar">Contas a Pagar</TabsTrigger>
              <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
            </TabsList>

            {/* Sub-aba: Contas a Pagar */}
            <TabsContent value="contas-pagar" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle>Filtros - Contas a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar por descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={accountFilter} onValueChange={setAccountFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Conta/Cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        
                        {/* Contas Bancárias */}
                        {filterOptions?.accounts.filter(account => 
                          !account.name.includes('💳')
                        ).length > 0 && (
                          <>
                            <SelectGroup>
                              <SelectLabel>Contas Bancárias</SelectLabel>
                              {filterOptions.accounts
                                .filter(account => !account.name.includes('💳'))
                                .map((account) => (
                                  <SelectItem key={account.id} value={account.id.toString()}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </>
                        )}
                        
                        {/* Cartões */}
                        {filterOptions?.accounts.filter(account => 
                          account.name.includes('💳')
                        ).length > 0 && (
                          <>
                            <SelectGroup>
                              <SelectLabel>Cartões</SelectLabel>
                              {filterOptions.accounts
                                .filter(account => account.name.includes('💳'))
                                .map((account) => (
                                  <SelectItem key={account.id} value={account.id.toString()}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-col gap-1">
                      <Input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-[180px]"
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setSearchTerm("");
                      setStatusFilter("");
                      setAccountFilter("");
                      setFilterMonth(new Date().toISOString().slice(0, 7));
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Barras - Total a Pagar por Mês */}
              <Card>
                <CardHeader>
                  <CardTitle>Total a Pagar por Mês</CardTitle>
                  <CardDescription>2 meses anteriores, mês atual e próximos 9 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  {payablesByMonth && payablesByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={payablesByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value || 0)} />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value) || 0), "Total a Pagar"]}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Bar 
                          dataKey="total" 
                          name="Total a Pagar"
                          radius={[4, 4, 0, 0]}
                        >
                          {payablesByMonth.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.isCurrentMonth ? "#dc2626" : "#ef4444"} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado encontrado para o gráfico</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabela de Contas a Pagar */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Contas a Pagar</CardTitle>
                  <CardDescription>
                    {movementsPaginated ? `${movementsPaginated.total} contas encontradas` : 'Carregando...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Conta/Cartão</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movementsPaginated?.movements
                          ?.map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell className="font-medium">
                                {movement.description}
                                {movement.installment_number && movement.total_installments && (
                                  <div className="text-xs text-muted-foreground">
                                    Parcela {movement.installment_number}/{movement.total_installments}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{movement.customer_supplier || 'N/A'}</TableCell>
                              <TableCell>{movement.category || 'N/A'}</TableCell>
                              <TableCell>{movement.account || 'N/A'}</TableCell>
                              <TableCell>
                                {movement.due_date ? format(new Date(movement.due_date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(movement.amount || 0)}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    movement.status_display === 'Pago' ? 'default' : 
                                    movement.status_display === 'Vencido' ? 'destructive' : 
                                    'secondary'
                                  }
                                >
                                  {movement.status_display}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewMovement(movement)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditMovement(movement)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {movementsPaginated && movementsPaginated.total_pages > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Página {movementsPaginated.current_page} de {movementsPaginated.total_pages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(movementsPaginated.total_pages, currentPage + 1))}
                          disabled={currentPage >= movementsPaginated.total_pages}
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-aba: Contas a Receber */}
            <TabsContent value="contas-receber" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Vencimentos futuros e status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total a Receber</span>
                      <span className="font-semibold text-success">
                        {summary ? formatCurrency(summary.pending_receivables) : 'R$ 0,00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Em Atraso</span>
                      <span className="font-semibold text-destructive">
                        {summary ? formatCurrency(summary.overdue_receivables) : 'R$ 0,00'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>• Próximos vencimentos: Esta semana</p>
                      <p>• Maior valor: {summary ? formatCurrency(summary.pending_receivables) : 'R$ 0,00'}</p>
                      <p>• Status de cobrança automatizada</p>
                    </div>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Conta a Receber
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Aba: Previsão de Caixa */}
        <TabsContent value="previsao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Previsão de Caixa (Forecast)</CardTitle>
              <CardDescription>Simulação de caixa futuro com diferentes cenários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <Button variant="outline">Cenário Realista</Button>
                  <Button variant="outline">Cenário Otimista</Button>
                  <Button variant="outline">Cenário Pessimista</Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Saldo Previsto</TableHead>
                        <TableHead>Contas a Receber</TableHead>
                        <TableHead>Contas a Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecast.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.expected_balance)}</TableCell>
                          <TableCell className="text-success">{formatCurrency(item.receivables)}</TableCell>
                          <TableCell className="text-destructive">{formatCurrency(item.payables)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: DRE */}
        <TabsContent value="dre" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
                <CardDescription>Resumo das receitas, custos e resultados da empresa</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="flex flex-col gap-1">
                  <Input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <Button variant="outline" onClick={() => setFilterMonth(new Date().toISOString().slice(0, 7))}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Resumo dos Indicadores */}
                {dreData && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-success">Receita Bruta</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-success">
                          {formatCurrency(dreData.revenue_total)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Base de cálculo: 100%
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">Lucro Bruto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(dreData.gross_profit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dreData.revenue_total > 0 ? ((dreData.gross_profit / dreData.revenue_total) * 100).toFixed(1) : '0'}% da receita
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600">Resultado Operacional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(dreData.operational_result)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dreData.revenue_total > 0 ? ((dreData.operational_result / dreData.revenue_total) * 100).toFixed(1) : '0'}% da receita
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Resultado Líquido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${dreData.net_result >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(dreData.net_result)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dreData.revenue_total > 0 ? ((dreData.net_result / dreData.revenue_total) * 100).toFixed(1) : '0'}% da receita
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tabela DRE */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left font-bold">Descrição</TableHead>
                        <TableHead className="text-left font-bold">Valor</TableHead>
                        <TableHead className="text-left font-bold">% Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dreData?.sections.map((section, sectionIndex) => (
                        <React.Fragment key={`${section.title}-${sectionIndex}`}>
                          {/* Cabeçalho da Seção */}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="font-bold text-left py-3">
                              {section.title}
                            </TableCell>
                          </TableRow>
                          
                          {/* Items da Seção */}
                          {section.items.map((item, itemIndex) => (
                            <TableRow key={`${item.description}-${itemIndex}`} className={item.level === 2 ? "bg-blue-50" : ""}>
                              <TableCell className={`${item.level === 1 ? "font-bold" : item.level === 2 ? "font-semibold text-blue-700" : ""} pl-${item.level * 2}`}>
                                {item.description}
                              </TableCell>
                              <TableCell className={`text-right ${item.level === 1 ? "font-bold" : item.level === 2 ? "font-semibold text-blue-700" : "font-medium"}`}>
                                {formatCurrency(item.value)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.percentage !== undefined && (
                                  <Badge variant={item.level === 2 ? "default" : "secondary"}>
                                    {item.percentage.toFixed(1)}%
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Total da Seção */}
                          {section.total !== 0 && section.items.length > 1 && (
                            <TableRow className="border-t-2 border-muted">
                              <TableCell className="font-semibold text-primary">
                                = {section.title}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-primary">
                                {formatCurrency(section.total)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="default">
                                  {dreData.revenue_total > 0 ? ((section.total / dreData.revenue_total) * 100).toFixed(1) : '0.0'}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                      
                      {/* Resultado Final */}
                      {dreData && (
                        <TableRow className="bg-primary/10 border-t-4 border-primary">
                          <TableCell className="font-bold text-primary text-lg">
                            RESULTADO LÍQUIDO FINAL
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary text-lg">
                            {formatCurrency(dreData.net_result)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default" className="text-lg">
                              {dreData.revenue_total > 0 ? ((dreData.net_result / dreData.revenue_total) * 100).toFixed(1) : '0.0'}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Gestão de Capital de Giro */}
        <TabsContent value="capital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Capital de Giro</CardTitle>
              <CardDescription>Monitoramento e alertas para gargalos de caixa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contas a Receber</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium">Prazo Médio</p>
                      <p className="text-2xl font-bold text-blue-600">45 dias</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium">Valor Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary ? formatCurrency(summary.pending_receivables) : 'R$ 0,00'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contas a Pagar</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="font-medium">Prazo Médio</p>
                      <p className="text-2xl font-bold text-orange-600">30 dias</p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium">Valor Total</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary ? formatCurrency(summary.pending_payables) : 'R$ 0,00'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alertas</h3>
                  <div className="space-y-2">
                    {summary && summary.overdue_receivables > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-800">⚠️ Contas Vencidas</p>
                        <p className="text-sm text-yellow-700">
                          {formatCurrency(summary.overdue_receivables)} em recebimentos vencidos
                        </p>
                      </div>
                    )}
                    {summary && summary.overdue_payables > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">🚨 Contas Vencidas</p>
                        <p className="text-sm text-red-700">
                          {formatCurrency(summary.overdue_payables)} em pagamentos vencidos
                        </p>
                      </div>
                    )}
                    {summary && summary.current_balance > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">✅ Fluxo Positivo</p>
                        <p className="text-sm text-green-700">
                          Saldo atual: {formatCurrency(summary.current_balance)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Movimentação */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>Informações completas da movimentação</DialogDescription>
          </DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Entrada</Label>
                  <p className="text-sm font-medium">{formatDate(selectedMovement.date)}</p>
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <p className="text-sm font-medium">
                    {selectedMovement.due_date ? formatDate(selectedMovement.due_date) : 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm font-medium">{selectedMovement.description}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className={`text-sm font-medium ${selectedMovement.type === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(selectedMovement.amount)}
                  </p>
                </div>
                <div>
                  <Label>Cliente/Fornecedor</Label>
                  <p className="text-sm font-medium">{selectedMovement.customer_supplier || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <p className="text-sm font-medium">{selectedMovement.category || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Conta</Label>
                  <p className="text-sm font-medium">{selectedMovement.account || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedMovement.status)}>
                    {selectedMovement.status_display}
                  </Badge>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Badge variant={selectedMovement.type === 'entrada' ? 'default' : 'destructive'}>
                    {selectedMovement.type === 'entrada' ? 'Entrada' : 'Saída'}
                  </Badge>
                </div>
              </div>
              {selectedMovement.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedMovement.notes}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMovementModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => handleEditMovement(selectedMovement)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}