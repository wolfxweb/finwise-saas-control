import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2, Save, X, Calendar, DollarSign, Users, BarChart3, Tag, AlertCircle, ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Account {
  id: string;
  bank_id: string;
  bank_name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'credit' | 'debit';
  account_number: string;
  agency: string;
  holder_name: string;
  balance: number;
  limit: number;
  available_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  receivables_count: number;
  children_count: number;
  created_at: string;
}

interface AccountsReceivable {
  id: number;
  description: string;
  customer_id: number;
  customer_name: string;
  category_id?: number;
  category_name?: string;
  account_id?: number;
  account_name?: string;
  receivable_type: "cash" | "installment";
  status: "pending" | "paid" | "overdue" | "cancelled";
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  entry_date: string;
  due_date: string;
  payment_date?: string;
  installment_number: number;
  total_installments: number;
  installment_amount?: number;
  notes?: string;
  reference?: string;
  is_overdue: boolean;
  created_at: string;
}

interface AccountsReceivableSummary {
  total_receivable: number;
  total_paid: number;
  total_overdue: number;
  total_pending: number;
  overdue_count: number;
  pending_count: number;
  paid_count: number;
  by_status: {
    pending: number;
    paid: number;
    overdue: number;
  };
  by_month: Array<{
    month: string;
    total: number;
  }>;
}

export default function ContasReceber() {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [summary, setSummary] = useState<AccountsReceivableSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  
  // Estados para filtros avançados
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    category: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    tipo: '',
    reference: ''
  });

  
  // Estados para paginação e ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para relatórios
  const [reportPeriod, setReportPeriod] = useState('ultimo_mes');
  
  // Estados para filtros de relatórios
  const [filtrosRelatorio, setFiltrosRelatorio] = useState({
    categoria: '',
    subcategoria: '',
    cliente: '',
    status: '',
    tipo: '',
    valorMin: '',
    valorMax: '',
    dataInicio: '',
    dataFim: '',
    vencimentoInicio: '',
    vencimentoFim: ''
  });
  
  const [reportData, setReportData] = useState({
    monthlyData: [],
    statusData: [],
    customerData: [],
    customerEvolutionData: []
  });

  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<AccountsReceivable | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  
  // Estados da modal de confirmação de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [receivableToDelete, setReceivableToDelete] = useState<AccountsReceivable | null>(null);
  
  // Estados para remover todos
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Estados para abas
  const [activeMainTab, setActiveMainTab] = useState("receivables");
  
  // Estados para categorias
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: null as number | null,
    is_active: true,
    sort_order: 0
  });
  
  const [formData, setFormData] = useState({
    description: "",
    customer_id: 0,
    category_id: 0,
    account_id: 0,
    receivable_type: "cash" as "cash" | "installment",
    total_amount: 0,
    entry_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    notes: "",
    reference: "",
    // Status e pagamento
    status: "pending" as "pending" | "paid" | "overdue" | "cancelled",
    paid_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    // Parcelamento
    total_installments: 1,
    installment_amount: 0,
    installment_interval_days: 30,
    first_due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
    // Aplicar filtro automático: 30 dias antes até 30 dias depois da data atual
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    setFilters(prev => ({
      ...prev,
      dataInicio: thirtyDaysAgo.toISOString().split('T')[0],
      dataFim: thirtyDaysFromNow.toISOString().split('T')[0]
    }));
  }, []);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    resetPage();
  }, [searchTerm, filterStatus, filterMonth]);

  // Processar dados dos relatórios quando receivables, reportPeriod ou filtros mudarem
  useEffect(() => {
    if (receivables.length > 0) {
      processReportData();
    }
  }, [receivables, reportPeriod, filtrosRelatorio]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadReceivables(),
        loadSummary(),
        loadCustomers(),
        loadCategories(),
        loadAccounts()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReceivables = async () => {
    try {
      // Buscar todos os registros (limit=1000 para pegar mais registros)
      const response = await api.get("/api/v1/accounts-receivable/?limit=1000");
      setReceivables(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar contas a receber:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas a receber",
        variant: "destructive"
      });
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get("/api/v1/accounts-receivable/reports/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get("/api/v1/customers/");
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/api/v1/categories/");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get("/api/v1/accounts/");
      setAccounts(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    }
  };

  const handleCreateReceivable = () => {
    setEditingReceivable(null);
    setIsViewMode(false);
    setIsInstallmentMode(false);
    setActiveTab("basic");
    setFormData({
      description: "",
      customer_id: 0,
      category_id: 0,
      account_id: 0,
      receivable_type: "cash",
      total_amount: 0,
      entry_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      notes: "",
      reference: "",
      status: "pending",
      paid_amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      total_installments: 1,
      installment_amount: 0,
      installment_interval_days: 30,
      first_due_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleViewReceivable = async (receivable: AccountsReceivable) => {
    try {
      const response = await api.get(`/api/v1/accounts-receivable/${receivable.id}`);
      const fullReceivable = response.data;
      
      setEditingReceivable(fullReceivable);
      setFormData({
        description: fullReceivable.description,
        customer_id: fullReceivable.customer_id,
        category_id: fullReceivable.category_id || 0,
        account_id: fullReceivable.account_id || 0,
        receivable_type: fullReceivable.receivable_type,
        total_amount: fullReceivable.total_amount,
        entry_date: fullReceivable.entry_date,
        due_date: fullReceivable.due_date,
        notes: fullReceivable.notes || "",
        reference: fullReceivable.reference || "",
        status: fullReceivable.status,
        paid_amount: fullReceivable.paid_amount || 0,
        payment_date: fullReceivable.payment_date || new Date().toISOString().split('T')[0],
        total_installments: fullReceivable.total_installments,
        installment_amount: fullReceivable.installment_amount || 0,
        installment_interval_days: 30,
        first_due_date: fullReceivable.due_date
      });
      setIsViewMode(true);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da conta a receber",
        variant: "destructive"
      });
    }
  };

  const handleEditReceivable = async (receivable: AccountsReceivable) => {
    try {
      const response = await api.get(`/api/v1/accounts-receivable/${receivable.id}`);
      const fullReceivable = response.data;
      
      console.log('Dados recebidos do backend:', fullReceivable);
      console.log('Account ID:', fullReceivable.account_id);
      console.log('Account Name:', fullReceivable.account_name);
      
      setEditingReceivable(fullReceivable);
      setFormData({
        description: fullReceivable.description,
        customer_id: fullReceivable.customer_id,
        category_id: fullReceivable.category_id || 0,
        account_id: fullReceivable.account_id || 0,
        receivable_type: fullReceivable.receivable_type,
        total_amount: fullReceivable.total_amount,
        entry_date: fullReceivable.entry_date,
        due_date: fullReceivable.due_date,
        notes: fullReceivable.notes || "",
        reference: fullReceivable.reference || "",
        status: fullReceivable.status,
        paid_amount: fullReceivable.paid_amount || 0,
        payment_date: fullReceivable.payment_date || new Date().toISOString().split('T')[0],
        total_installments: fullReceivable.total_installments,
        installment_amount: fullReceivable.installment_amount || 0,
        installment_interval_days: 30,
        first_due_date: fullReceivable.due_date
      });
      setIsViewMode(false);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da conta a receber",
        variant: "destructive"
      });
    }
  };

  const handleSaveReceivable = async () => {
    try {
      if (isInstallmentMode && formData.receivable_type === "installment" && formData.total_installments > 1) {
        // Criar parcelamento
        const installmentData = {
          description: formData.description,
          customer_id: formData.customer_id,
          category_id: formData.category_id === 0 ? null : formData.category_id,
          account_id: formData.account_id === 0 ? null : formData.account_id,
          total_amount: formData.total_amount,
          total_installments: formData.total_installments,
          installment_amount: formData.installment_amount || null,
          entry_date: formData.entry_date,
          first_due_date: formData.first_due_date,
          installment_interval_days: formData.installment_interval_days,
          notes: formData.notes,
          reference: formData.reference
        };
        
        await api.post("/api/v1/accounts-receivable/installments", installmentData);
        toast({
          title: "Sucesso",
          description: "Parcelamento criado com sucesso"
        });
      } else {
        // Criar conta única
        if (editingReceivable) {
          // Preparar dados para envio, convertendo category_id 0 para null e account_id vazio para null
          const updateData = { ...formData };
          if (updateData.category_id === 0) {
            updateData.category_id = null;
          }
          if (updateData.account_id === 0) {
            updateData.account_id = null;
          }
          
          await api.put(`/api/v1/accounts-receivable/${editingReceivable.id}`, updateData);
          toast({
            title: "Sucesso",
            description: "Conta a receber atualizada com sucesso"
          });
        } else {
          // Preparar dados para envio, convertendo category_id 0 para null e account_id vazio para null
          const createData = { ...formData };
          if (createData.category_id === 0) {
            createData.category_id = null;
          }
          if (createData.account_id === 0) {
            createData.account_id = null;
          }
          
          await api.post("/api/v1/accounts-receivable/", createData);
          toast({
            title: "Sucesso",
            description: "Conta a receber criada com sucesso"
          });
        }
      }
      
      setIsModalOpen(false);
      setEditingReceivable(null);
      setIsViewMode(false);
      setIsInstallmentMode(false);
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar conta a receber:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao salvar conta a receber",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReceivable = (receivable: AccountsReceivable) => {
    setReceivableToDelete(receivable);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReceivable = async () => {
    if (!receivableToDelete) return;

    try {
      await api.delete(`/api/v1/accounts-receivable/${receivableToDelete.id}`);
      
      toast({
        title: "Sucesso",
        description: "Conta a receber deletada com sucesso"
      });
      
      setIsDeleteModalOpen(false);
      setReceivableToDelete(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao deletar conta a receber:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao deletar conta a receber",
        variant: "destructive"
      });
    }
  };

  // Função para remover todos os lançamentos
  const handleDeleteAllReceivables = () => {
    setIsDeleteAllModalOpen(true);
  };

  const confirmDeleteAllReceivables = async () => {
    try {
      await api.delete("/api/v1/accounts-receivable/");
      toast({
        title: "Sucesso",
        description: "Todas as contas a receber foram excluídas com sucesso"
      });
      setIsDeleteAllModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Erro ao excluir todas as contas a receber:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao excluir todas as contas a receber",
        variant: "destructive"
      });
    }
  };

  const handleQuickStatusChange = async (receivable: AccountsReceivable, newStatus: "pending" | "paid" | "overdue" | "cancelled") => {
    try {
      const updateData: any = { status: newStatus };
      
      // Se mudando para pago, definir valor pago e data
      if (newStatus === "paid") {
        updateData.paid_amount = receivable.total_amount;
        updateData.payment_date = new Date().toISOString().split('T')[0];
      } else if (newStatus === "pending") {
        // Se voltando para pendente, zerar valor pago
        updateData.paid_amount = 0;
        updateData.payment_date = null;
      }
      
      // Não enviar category_id se for 0 (sem categoria)
      if (receivable.category_id === 0) {
        updateData.category_id = null;
      }
      
      await api.put(`/api/v1/accounts-receivable/${receivable.id}`, updateData);
      
      toast({
        title: "Sucesso",
        description: `Status alterado para ${newStatus === "paid" ? "Pago" : newStatus === "pending" ? "Pendente" : newStatus === "overdue" ? "Vencido" : "Cancelado"}`
      });
      
      loadData();
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao alterar status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  // Função para ordenar dados
  const sortData = (data: any[]) => {
    return data.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Tratar datas
      if (sortField === 'due_date' || sortField === 'entry_date' || sortField === 'payment_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Tratar valores numéricos
      if (sortField === 'total_amount' || sortField === 'paid_amount' || sortField === 'remaining_amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Tratar strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Função para aplicar filtros avançados
  const applyFilters = (data: any[]) => {
    return data.filter(receivable => {
      // Filtro por busca geral
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          receivable.description.toLowerCase().includes(searchLower) ||
          receivable.customer_name.toLowerCase().includes(searchLower) ||
          (receivable.reference && receivable.reference.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Filtro por status
      if (filters.status && receivable.status !== filters.status) return false;

      // Filtro por cliente
      if (filters.customer && !receivable.customer_name.toLowerCase().includes(filters.customer.toLowerCase())) return false;

      // Filtro por categoria
      if (filters.category && receivable.category_id !== parseInt(filters.category)) return false;

      // Filtro por tipo
      if (filters.tipo && receivable.receivable_type !== filters.tipo) return false;

      // Filtro por referência
      if (filters.reference && !receivable.reference?.includes(filters.reference)) return false;

      // Filtro por data
      if (filters.dataInicio || filters.dataFim) {
        const dataReceivable = new Date(receivable.due_date);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          if (dataReceivable < dataInicio) return false;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
          if (dataReceivable > dataFim) return false;
        }
      }

      // Filtro por valor
      const valorReceivable = parseFloat(receivable.total_amount || 0);
      if (filters.valorMin && valorReceivable < parseFloat(filters.valorMin)) return false;
      if (filters.valorMax && valorReceivable > parseFloat(filters.valorMax)) return false;

      // Filtro por mês de vencimento
      if (filterMonth) {
        const dueDate = new Date(receivable.due_date);
        const filterYear = parseInt(filterMonth.split('-')[0]);
        const filterMonthNum = parseInt(filterMonth.split('-')[1]);
        if (dueDate.getFullYear() !== filterYear || (dueDate.getMonth() + 1) !== filterMonthNum) {
          return false;
        }
      }

      return true;
    });
  };

  // Função para obter dados paginados e ordenados
  const getPaginatedData = () => {
    const filteredData = applyFilters(receivables);
    
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  // Função para obter total de páginas
  const getTotalPages = () => {
    const filteredData = applyFilters(receivables);
    return Math.ceil(filteredData.length / itemsPerPage);
  };

  // Função para renderizar ícone de ordenação
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Função para lidar com ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Função para resetar página quando filtros mudarem
  const resetPage = () => {
    setCurrentPage(1);
  };

  // Função para calcular estatísticas filtradas
  const calculateFilteredStats = () => {
    const filteredData = applyFilters(receivables);
    
    const total_receivable = filteredData.reduce((sum, receivable) => {
      const amount = Number(receivable.total_amount) || 0;
      return sum + amount;
    }, 0);
    
    const total_paid = filteredData.reduce((sum, receivable) => {
      const amount = Number(receivable.paid_amount) || 0;
      return sum + amount;
    }, 0);
    
    const total_overdue = filteredData.filter(r => r.status === 'overdue').reduce((sum, receivable) => {
      const amount = Number(receivable.remaining_amount) || 0;
      return sum + amount;
    }, 0);
    
    const total_pending = filteredData.filter(r => r.status === 'pending').reduce((sum, receivable) => {
      const amount = Number(receivable.remaining_amount) || 0;
      return sum + amount;
    }, 0);
    
    return {
      total_receivable,
      total_paid,
      total_overdue,
      total_pending
    };
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      customer: '',
      category: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      tipo: '',
      reference: ''
    });
    setSearchTerm('');
    setFilterMonth(new Date().toISOString().slice(0, 7));
    setCurrentPage(1);
  };

  // Função para aplicar filtros
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterDialogOpen(false);
  };

  // Função para verificar se há filtros ativos
  const hasActiveFilters = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return Object.values(filters).some(value => value !== '') || 
           searchTerm !== '' || 
           filterMonth !== currentMonth;
  };

  const aplicarFiltrosRelatorio = (dados: any[]) => {
    console.log('🔍 Aplicando filtros de relatório:', filtrosRelatorio);
    console.log('📊 Dados antes dos filtros:', dados.length);
    
    const dadosFiltrados = dados.filter(receivable => {
      // Filtro por categoria
      if (filtrosRelatorio.categoria && receivable.category_id?.toString() !== filtrosRelatorio.categoria) {
        return false;
      }
      
      // Filtro por subcategoria (categoria filha)
      if (filtrosRelatorio.subcategoria && receivable.category_id?.toString() !== filtrosRelatorio.subcategoria) {
        return false;
      }
      
      // Filtro por cliente
      if (filtrosRelatorio.cliente && !receivable.customer_name?.toLowerCase().includes(filtrosRelatorio.cliente.toLowerCase())) {
        return false;
      }
      
      // Filtro por status
      if (filtrosRelatorio.status && receivable.status !== filtrosRelatorio.status) {
        return false;
      }
      
      // Filtro por tipo
      if (filtrosRelatorio.tipo && receivable.receivable_type !== filtrosRelatorio.tipo) {
        return false;
      }
      
      // Filtro por valor mínimo
      if (filtrosRelatorio.valorMin && receivable.total_amount < parseFloat(filtrosRelatorio.valorMin)) {
        return false;
      }
      
      // Filtro por valor máximo
      if (filtrosRelatorio.valorMax && receivable.total_amount > parseFloat(filtrosRelatorio.valorMax)) {
        return false;
      }
      
      // Filtro por data de entrada início
      if (filtrosRelatorio.dataInicio) {
        const dataEntrada = new Date(receivable.entry_date);
        const dataInicio = new Date(filtrosRelatorio.dataInicio);
        if (dataEntrada < dataInicio) {
          return false;
        }
      }
      
      // Filtro por data de entrada fim
      if (filtrosRelatorio.dataFim) {
        const dataEntrada = new Date(receivable.entry_date);
        const dataFim = new Date(filtrosRelatorio.dataFim);
        if (dataEntrada > dataFim) {
          return false;
        }
      }
      
      // Filtro por data de vencimento início
      if (filtrosRelatorio.vencimentoInicio) {
        const dataVencimento = new Date(receivable.due_date);
        const vencimentoInicio = new Date(filtrosRelatorio.vencimentoInicio);
        if (dataVencimento < vencimentoInicio) {
          return false;
        }
      }
      
      // Filtro por data de vencimento fim
      if (filtrosRelatorio.vencimentoFim) {
        const dataVencimento = new Date(receivable.due_date);
        const vencimentoFim = new Date(filtrosRelatorio.vencimentoFim);
        if (dataVencimento > vencimentoFim) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('✅ Dados após filtros:', dadosFiltrados.length);
    return dadosFiltrados;
  };

  const limparFiltrosRelatorio = () => {
    setFiltrosRelatorio({
      categoria: '',
      subcategoria: '',
      cliente: '',
      status: '',
      tipo: '',
      valorMin: '',
      valorMax: '',
      dataInicio: '',
      dataFim: '',
      vencimentoInicio: '',
      vencimentoFim: ''
    });
  };

  const hasActiveFiltersRelatorio = () => {
    return Object.values(filtrosRelatorio).some(value => value !== '');
  };

  // Funções para processar dados dos relatórios
  const processReportData = () => {
    console.log('🔄 Processando dados de relatório...');
    console.log('📅 Período:', reportPeriod);
    console.log('🔧 Filtros ativos:', hasActiveFiltersRelatorio());
    
    let filteredData = receivables.filter(receivable => {
      const receivableDate = new Date(receivable.due_date);
      const now = new Date();
      const startDate = new Date();
      
      switch (reportPeriod) {
        case 'ultima_semana':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'ultimo_mes':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'ultimos_3_meses':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'ultimo_ano':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return true;
      }
      
      return receivableDate >= startDate && receivableDate <= now;
    });

    console.log('📊 Dados após filtro de período:', filteredData.length);

    // Aplicar filtros adicionais de relatório
    filteredData = aplicarFiltrosRelatorio(filteredData);

    console.log('📊 Dados finais para relatórios:', filteredData.length);

    // Dados mensais
    const monthlyData = filteredData.reduce((acc, receivable) => {
      const month = new Date(receivable.due_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        existing.total += receivable.total_amount;
        existing.paid += receivable.paid_amount;
        existing.pending += (receivable.total_amount - receivable.paid_amount);
      } else {
        acc.push({
          month,
          total: receivable.total_amount,
          paid: receivable.paid_amount,
          pending: receivable.total_amount - receivable.paid_amount
        });
      }
      
      return acc;
    }, [] as any[]);

    // Dados por status
    const statusData = [
      { name: 'Pendente', value: filteredData.filter(r => r.status === 'pending').length, color: '#f59e0b' },
      { name: 'Pago', value: filteredData.filter(r => r.status === 'paid').length, color: '#10b981' },
      { name: 'Vencido', value: filteredData.filter(r => r.status === 'overdue').length, color: '#ef4444' },
      { name: 'Cancelado', value: filteredData.filter(r => r.status === 'cancelled').length, color: '#6b7280' }
    ];

    // Dados por cliente
    const customerData = filteredData.reduce((acc, receivable) => {
      const existing = acc.find(item => item.customer === receivable.customer_name);
      
      if (existing) {
        existing.total += receivable.total_amount;
        existing.count += 1;
      } else {
        acc.push({
          customer: receivable.customer_name,
          total: receivable.total_amount,
          count: 1
        });
      }
      
      return acc;
    }, [] as any[]).sort((a, b) => b.total - a.total).slice(0, 10);

    // Dados de evolução por cliente mês a mês
    const customerEvolutionData = filteredData.reduce((acc, receivable) => {
      const month = new Date(receivable.due_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const customerName = receivable.customer_name;
      
      const existingMonth = acc.find(item => item.month === month);
      
      if (existingMonth) {
        if (existingMonth[customerName]) {
          existingMonth[customerName] += receivable.total_amount;
        } else {
          existingMonth[customerName] = receivable.total_amount;
        }
      } else {
        const newMonth: any = { month };
        newMonth[customerName] = receivable.total_amount;
        acc.push(newMonth);
      }
      
      return acc;
    }, [] as any[]).sort((a, b) => {
      const [mesA, anoA] = a.month.split('/');
      const [mesB, anoB] = b.month.split('/');
      return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
    });

    console.log('📊 Dados de evolução por cliente:', customerEvolutionData);

    setReportData({
      monthlyData,
      statusData,
      customerData,
      customerEvolutionData
    });
  };

  const filteredReceivables = getPaginatedData();

  const calculateInstallmentAmount = () => {
    if (formData.installment_amount && formData.installment_amount > 0) {
      // Se o valor da parcela foi informado, usar ele
      return formData.installment_amount;
    } else if (formData.total_amount && formData.total_installments > 0) {
      // Se não foi informado, calcular dividindo o total pelo número de parcelas
      return formData.total_amount / formData.total_installments;
    }
    return 0;
  };

  const calculateTotalFromInstallment = () => {
    if (formData.installment_amount && formData.total_installments > 0) {
      return formData.installment_amount * formData.total_installments;
    } else if (formData.total_amount && formData.total_installments > 0) {
      // Se não tem valor da parcela, usar o valor total
      return formData.total_amount;
    }
    return 0;
  };

  // Funções para categorias
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ 
      name: "", 
      code: "",
      description: "", 
      parent_id: null,
      is_active: true,
      sort_order: 0
    });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ 
      name: category.name, 
      code: category.code,
      description: category.description || "",
      parent_id: category.parent_id || null,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await api.put(`/api/v1/categories/${editingCategory.id}`, categoryFormData);
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso"
        });
      } else {
        await api.post("/api/v1/categories", categoryFormData);
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso"
        });
      }
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm("Tem certeza que deseja deletar esta categoria?")) {
      try {
        await api.delete(`/api/v1/categories/${categoryId}`);
        toast({
          title: "Sucesso",
          description: "Categoria deletada com sucesso"
        });
        loadCategories();
      } catch (error) {
        console.error("Erro ao deletar categoria:", error);
        toast({
          title: "Erro",
          description: "Erro ao deletar categoria",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Controle de receitas e recebimentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDeleteAllReceivables}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Todas
          </Button>
          <Button onClick={handleCreateReceivable}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

            {/* Abas Principais */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Aba: Contas a Receber */}
        <TabsContent value="receivables" className="space-y-6">
          {/* Cards de Resumo */}
          {summary && (
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {calculateFilteredStats().total_receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recebido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {calculateFilteredStats().total_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    R$ {calculateFilteredStats().total_overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    R$ {calculateFilteredStats().total_pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar contas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full md:w-[180px]"
                  />
                </div>
                <Button 
                  variant={hasActiveFilters() ? "default" : "outline"}
                  onClick={() => setIsFilterDialogOpen(true)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros {hasActiveFilters() && <Badge variant="secondary" className="ml-2">Ativo</Badge>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                {filteredReceivables.length} conta(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center gap-1">
                          Descrição
                          {getSortIcon('description')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('customer_name')}
                      >
                        <div className="flex items-center gap-1">
                          Cliente
                          {getSortIcon('customer_name')}
                        </div>
                      </TableHead>
                      <TableHead>Conta Bancária</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('total_amount')}
                      >
                        <div className="flex items-center gap-1">
                          Valor
                          {getSortIcon('total_amount')}
                        </div>
                      </TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('entry_date')}
                      >
                        <div className="flex items-center gap-1">
                          Data de Entrada
                          {getSortIcon('entry_date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('due_date')}
                      >
                        <div className="flex items-center gap-1">
                          Vencimento
                          {getSortIcon('due_date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.map((receivable) => (
                      <TableRow key={receivable.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{receivable.description}</div>
                            {receivable.receivable_type === "installment" && receivable.total_installments > 1 && (
                              <div className="text-sm text-muted-foreground">
                                Parcela {receivable.installment_number}/{receivable.total_installments}
                              </div>
                            )}
                            {receivable.reference && (
                              <div className="text-sm text-muted-foreground">
                                Ref: {receivable.reference}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{receivable.customer_name}</TableCell>
                        <TableCell>
                          <div>
                            {receivable.account_name ? (
                              <div className="font-medium">{receivable.account_name}</div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Não vinculada</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {receivable.total_installments > 1 ? (
                                // Para parcelamentos: mostra o valor total do parcelamento
                                `R$ ${(receivable.total_amount * receivable.total_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              ) : (
                                // Para contas à vista: mostra o valor da conta
                                `R$ ${receivable.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              )}
                            </div>
                            {receivable.paid_amount > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Pago: R$ {receivable.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                            {receivable.total_installments > 1 && (
                              <div className="text-sm text-muted-foreground">
                                Parcela: R$ {receivable.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {receivable.total_installments > 1 ? (
                              <span className="text-sm font-medium">
                                {receivable.installment_number}/{receivable.total_installments}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">À vista</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {receivable.entry_date ? new Date(receivable.entry_date).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(receivable.status)}
                            <Select
                              value={receivable.status}
                              onValueChange={(value) => handleQuickStatusChange(receivable, value as any)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Vencido</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceivable(receivable)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReceivable(receivable)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Alteração rápida de status */}
                            <div className="flex items-center gap-1">
                              {receivable.status !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickStatusChange(receivable, "paid")}
                                  className="text-green-600 hover:text-green-700"
                                  title="Marcar como Pago"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              {receivable.status !== "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickStatusChange(receivable, "pending")}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Marcar como Pendente"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              )}
                              {receivable.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickStatusChange(receivable, "cancelled")}
                                  className="text-gray-600 hover:text-gray-700"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReceivable(receivable)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Paginação */}
              {!isLoading && receivables.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, receivables.filter(r => {
                      const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           (r.reference && r.reference.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
                      return matchesSearch && matchesStatus;
                    }).length)} de {receivables.filter(r => {
                      const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           (r.reference && r.reference.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
                      return matchesSearch && matchesStatus;
                    }).length} contas a receber
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {getTotalPages()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Análise */}
        <TabsContent value="reports" className="space-y-6">
          {/* Filtros Globais para Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Filtros para Análise
                {hasActiveFiltersRelatorio() && (
                  <Badge variant="secondary" className="ml-2">Filtros Ativos</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure os filtros para refinar todas as análises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="filtro-categoria">Categoria Principal</Label>
                  <Select value={filtrosRelatorio.categoria} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.filter(cat => !cat.parent_id).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-subcategoria">Subcategoria</Label>
                  <Select value={filtrosRelatorio.subcategoria} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, subcategoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as subcategorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as subcategorias</SelectItem>
                      {categories.filter(cat => cat.parent_id).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-cliente">Cliente</Label>
                  <Input
                    placeholder="Digite o nome do cliente"
                    value={filtrosRelatorio.cliente}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, cliente: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-status">Status</Label>
                  <Select value={filtrosRelatorio.status} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-tipo">Tipo</Label>
                  <Select value={filtrosRelatorio.tipo} onValueChange={(value) => setFiltrosRelatorio({...filtrosRelatorio, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-valor-min">Valor Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filtrosRelatorio.valorMin}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, valorMin: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-valor-max">Valor Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filtrosRelatorio.valorMax}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, valorMax: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-data-inicio">Data Entrada Início</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.dataInicio}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, dataInicio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-data-fim">Data Entrada Fim</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.dataFim}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, dataFim: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-vencimento-inicio">Vencimento Início</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.vencimentoInicio}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, vencimentoInicio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-vencimento-fim">Vencimento Fim</Label>
                  <Input
                    type="date"
                    value={filtrosRelatorio.vencimentoFim}
                    onChange={(e) => setFiltrosRelatorio({...filtrosRelatorio, vencimentoFim: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={limparFiltrosRelatorio}>
                    Limpar Filtros
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      // Primeiro aplicar filtro de período
                      let dadosFiltrados = receivables.filter(receivable => {
                        const receivableDate = new Date(receivable.due_date);
                        const now = new Date();
                        const startDate = new Date();
                        
                        switch (reportPeriod) {
                          case 'ultima_semana':
                            startDate.setDate(now.getDate() - 7);
                            break;
                          case 'ultimo_mes':
                            startDate.setMonth(now.getMonth() - 1);
                            break;
                          case 'ultimos_3_meses':
                            startDate.setMonth(now.getMonth() - 3);
                            break;
                          case 'ultimo_ano':
                            startDate.setFullYear(now.getFullYear() - 1);
                            break;
                          default:
                            return true;
                        }
                        
                        return receivableDate >= startDate && receivableDate <= now;
                      });
                      
                      // Depois aplicar filtros adicionais
                      dadosFiltrados = aplicarFiltrosRelatorio(dadosFiltrados);
                      return `${dadosFiltrados.length} contas a receber encontradas`;
                    })()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ultima_semana">Última Semana</SelectItem>
                      <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                      <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                      <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Análise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles de Análise */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Contas a Receber</CardTitle>
              <CardDescription>Análises gráficas e insights das suas contas a receber</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  Todas as análises abaixo refletem os filtros aplicados acima
                </div>
              </div>

              {/* Gráfico de Linha - Valor x Mês */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução de Valores por Mês
                    {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Gráfico de linha mostrando a evolução dos valores totais, pagos e pendentes ao longo do tempo (reflete os filtros aplicados)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={reportData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Total"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="paid" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          name="Pago"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pending" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          name="Pendente"
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráficos em Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Gráfico de Pizza - Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribuição por Status
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <CardDescription>
                      Proporção de contas por status de pagamento (reflete os filtros aplicados)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.statusData.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <Pie
                            data={reportData.statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {reportData.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado disponível
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico de Barras - Top Clientes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Clientes
                      {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                    </CardTitle>
                    <CardDescription>
                      Principais clientes por valor total (reflete os filtros aplicados)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.customerData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.customerData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="customer" 
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor Total']}
                          />
                          <Bar dataKey="total" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum dado disponível
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Linha - Evolução por Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Evolução por Cliente
                    {hasActiveFiltersRelatorio() && <Badge variant="secondary" className="ml-2 text-xs">Filtrado</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Evolução do valor total por cliente ao longo do tempo (reflete os filtros aplicados)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.customerEvolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={reportData.customerEvolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        {(() => {
                          const clientes = new Set<string>();
                          reportData.customerEvolutionData.forEach(item => {
                            Object.keys(item).forEach(key => {
                              if (key !== 'month') {
                                clientes.add(key);
                              }
                            });
                          });
                          const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                          return Array.from(clientes).slice(0, 8).map((cliente, index) => (
                            <Line 
                              key={cliente} 
                              type="monotone" 
                              dataKey={cliente} 
                              stroke={cores[index % cores.length]} 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              name={cliente}
                            />
                          ));
                        })()}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Categorias</h2>
              <p className="text-muted-foreground">Organize suas contas a receber em categorias</p>
            </div>
            <Button onClick={handleCreateCategory} className="bg-gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          {/* Cards de Resumo - Categorias */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">Categorias cadastradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {categories.filter(c => c.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Ativas no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias Raiz</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {categories.filter(c => !c.parent_id).length}
                </div>
                <p className="text-xs text-muted-foreground">Categorias principais</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subcategorias</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {categories.filter(c => c.parent_id).length}
                </div>
                <p className="text-xs text-muted-foreground">Categorias filhas</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Categorias</CardTitle>
              <CardDescription>Lista de todas as categorias cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Buscar categorias..."
                    className="max-w-sm"
                  />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Contas</TableHead>
                        <TableHead>Subcategorias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.code}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.receivables_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.children_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "Visualizar Conta a Receber" : editingReceivable ? "Editar Conta a Receber" : "Nova Conta a Receber"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? "Visualize as informações da conta a receber" : editingReceivable ? "Edite as informações da conta a receber" : "Cadastre uma nova conta a receber"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Básicas</TabsTrigger>
              <TabsTrigger value="installment">Parcelamento</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição da conta a receber"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_id">Cliente *</Label>
                  <Select
                    value={formData.customer_id.toString()}
                    onValueChange={(value) => setFormData({...formData, customer_id: parseInt(value)})}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id">Categoria</Label>
                  <Select
                    value={formData.category_id.toString()}
                    onValueChange={(value) => setFormData({...formData, category_id: parseInt(value)})}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account_id">Conta Bancária</Label>
                  <Select
                    value={formData.account_id.toString()}
                    onValueChange={(value) => setFormData({...formData, account_id: parseInt(value) || 0})}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem conta</SelectItem>
                      {accounts
                        .filter(account => 
                          account.account_type === 'checking' || 
                          account.account_type === 'savings' || 
                          account.account_type === 'investment'
                        )
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.bank_name} - {account.account_number} ({account.holder_name})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receivable_type">Tipo</Label>
                  <Select
                    value={formData.receivable_type}
                    onValueChange={(value: "cash" | "installment") => {
                      setFormData({...formData, receivable_type: value});
                      if (value === "installment") {
                        setIsInstallmentMode(true);
                        setActiveTab("installment");
                      } else {
                        setIsInstallmentMode(false);
                        setFormData({...formData, receivable_type: value, total_installments: 1});
                      }
                    }}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À vista</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total_amount">Valor Total (R$) *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: parseFloat(e.target.value || "0")})}
                    placeholder="0.00"
                    disabled={isViewMode}
                  />
                </div>
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry_date">Data de Entrada *</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "pending" | "paid" | "overdue" | "cancelled") => setFormData({...formData, status: value})}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paid_amount">Valor Pago (R$)</Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({...formData, paid_amount: parseFloat(e.target.value || "0")})}
                    placeholder="0.00"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {formData.status === "paid" && (
                <div>
                  <Label htmlFor="payment_date">Data do Pagamento</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    disabled={isViewMode}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reference">Referência</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Referência externa"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Observações adicionais"
                    disabled={isViewMode}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="installment" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_installments">Número de Parcelas *</Label>
                  <Input
                    id="total_installments"
                    type="number"
                    min="2"
                    max="60"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({...formData, total_installments: parseInt(e.target.value || "1")})}
                    placeholder="2"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="installment_interval_days">Intervalo (dias) *</Label>
                  <Input
                    id="installment_interval_days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.installment_interval_days}
                    onChange={(e) => setFormData({...formData, installment_interval_days: parseInt(e.target.value || "30")})}
                    placeholder="30"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="installment_amount">Valor da Parcela (R$)</Label>
                  <Input
                    id="installment_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.installment_amount}
                    onChange={(e) => setFormData({...formData, installment_amount: parseFloat(e.target.value || "0")})}
                    placeholder="0.00"
                    disabled={isViewMode}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Deixe vazio para calcular automaticamente
                  </p>
                </div>
                <div>
                  <Label htmlFor="first_due_date">Primeira Parcela *</Label>
                  <Input
                    id="first_due_date"
                    type="date"
                    value={formData.first_due_date}
                    onChange={(e) => setFormData({...formData, first_due_date: e.target.value})}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* Resumo do parcelamento */}
              {formData.total_installments > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Parcelamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Valor da parcela:</span>
                      <span className="font-medium">
                        R$ {calculateInstallmentAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total do parcelamento:</span>
                      <span className="font-medium">
                        R$ {calculateTotalFromInstallment().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Número de parcelas:</span>
                      <span className="font-medium">{formData.total_installments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intervalo entre parcelas:</span>
                      <span className="font-medium">{formData.installment_interval_days} dias</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            {!isViewMode && (
              <Button onClick={handleSaveReceivable}>
                <Save className="h-4 w-4 mr-2" />
                {editingReceivable ? "Atualizar" : "Criar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Categorias */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Edite as informações da categoria" : "Crie uma nova categoria para organizar suas contas a receber"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Informações Básicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_name">Nome da Categoria *</Label>
                  <Input
                    id="category_name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    placeholder="Nome da categoria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_code">Código *</Label>
                  <Input
                    id="category_code"
                    value={categoryFormData.code}
                    onChange={(e) => setCategoryFormData({...categoryFormData, code: e.target.value})}
                    placeholder="Código único"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_description">Descrição</Label>
                <Textarea
                  id="category_description"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="Descrição da categoria"
                  rows={3}
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Configurações</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_parent">Categoria Pai</Label>
                  <Select 
                    value={categoryFormData.parent_id?.toString() || ""} 
                    onValueChange={(value) => setCategoryFormData({
                      ...categoryFormData, 
                      parent_id: value ? parseInt(value) : null
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria pai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (Categoria Raiz)</SelectItem>
                      {categories
                        .filter(cat => cat.id !== editingCategory?.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_sort_order">Ordem de Exibição</Label>
                  <Input
                    id="category_sort_order"
                    type="number"
                    value={categoryFormData.sort_order}
                    onChange={(e) => setCategoryFormData({...categoryFormData, sort_order: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="category_is_active"
                  checked={categoryFormData.is_active}
                  onCheckedChange={(checked) => setCategoryFormData({...categoryFormData, is_active: checked})}
                />
                <Label htmlFor="category_is_active">Categoria Ativa</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? "Atualizar" : "Criar"} Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a conta a receber{" "}
              <span className="font-semibold text-foreground">
                "{receivableToDelete?.description}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteReceivable}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão em Massa */}
      <Dialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção em Massa</DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-2 text-red-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Atenção!</span>
              </div>
              Tem certeza que deseja remover <span className="font-semibold text-foreground">TODAS</span> as contas a receber?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita e removerá {receivables.length} lançamento(s).
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteAllReceivables}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtros Avançados */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtros Avançados - Contas a Receber</DialogTitle>
            <DialogDescription>
              Configure os filtros para refinar sua busca
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filtros Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-tipo">Tipo</Label>
                <Select value={filters.tipo} onValueChange={(value) => setFilters({...filters, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="cash">À Vista</SelectItem>
                    <SelectItem value="installment">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-cliente">Cliente</Label>
                <Input
                  placeholder="Digite o nome do cliente"
                  value={filters.customer}
                  onChange={(e) => setFilters({...filters, customer: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-categoria">Categoria</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-reference">Referência</Label>
                <Input
                  placeholder="Digite a referência"
                  value={filters.reference}
                  onChange={(e) => setFilters({...filters, reference: e.target.value})}
                />
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="space-y-4">
              <Label>Período de Vencimento</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-data-inicio">Data Início</Label>
                  <Input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-data-fim">Data Fim</Label>
                  <Input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Valor */}
            <div className="space-y-4">
              <Label>Faixa de Valor</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-valor-min">Valor Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.valorMin}
                    onChange={(e) => setFilters({...filters, valorMin: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-valor-max">Valor Máximo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.valorMax}
                    onChange={(e) => setFilters({...filters, valorMax: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApplyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}