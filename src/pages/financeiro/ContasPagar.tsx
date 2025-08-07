import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2, Save, X, Calendar, DollarSign, Users, BarChart3, Tag, AlertCircle, ChevronUp, ChevronDown, TrendingUp, Clock, Target, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
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



interface Supplier {
  id: string; // UUID
  name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  payables_count: number;
  children_count: number;
  created_at: string;
}

interface Account {
  id: number;
  bank_id: number;
  bank_name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'credit' | 'debit';
  account_number: string;
  agency: string;
  holder_name: string;
  balance: number;
  limit: number;
  is_active: boolean;
  notes?: string;
}

interface AccountsPayable {
  id: number;
  description: string;
  supplier_id: string; // UUID
  category_id?: number;
  payable_type: "cash" | "installment";
  status: "pending" | "paid" | "overdue" | "cancelled";
  total_amount: number | string; // API pode retornar como string
  paid_amount: number | string; // API pode retornar como string
  entry_date: string;
  due_date: string;
  payment_date?: string;
  installment_number: number;
  total_installments: number;
  installment_amount?: number | string; // API pode retornar como string
  notes?: string;
  reference?: string;
  is_fixed_cost?: boolean;
  is_overdue: boolean;
  created_at: string;
}

interface AccountsPayableSummary {
  total_payable: number;
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

interface PayableAnalysisMonth {
  month: string;
  year: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  count_total: number;
  count_paid: number;
  count_pending: number;
  count_overdue: number;
}

interface PayableAnalysisCategory {
  category_id?: number;
  category_name: string;
  total_amount: number;
  percentage: number;
  count: number;
}

interface PayableAnalysisSupplier {
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  percentage: number;
  count: number;
}

interface PayableAnalysisForecast {
  date: string;
  amount: number;
  description: string;
  supplier_name: string;
  category_name?: string;
  is_fixed_cost: boolean;
}

interface PayableAnalysisResponse {
  current_month: PayableAnalysisMonth;
  next_months: PayableAnalysisMonth[];
  categories: PayableAnalysisCategory[];
  suppliers: PayableAnalysisSupplier[];
  forecast: PayableAnalysisForecast[];
  summary: {
    total_analysis_period: number;
    total_pending_period: number;
    total_forecast_30_days: number;
    fixed_costs_percentage: number;
    top_category?: string;
    top_supplier?: string;
  };
}

export default function ContasPagar() {
  const { toast } = useToast();
  
  // Função para formatar valores em Real Brasileiro
  const formatCurrency = (value: number) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [summary, setSummary] = useState<AccountsPayableSummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM para mês atual
  
  // Estados para análise
  const [analysisData, setAnalysisData] = useState<PayableAnalysisResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisFilters, setAnalysisFilters] = useState({
    months_ahead: 6,
    category_filter: '',
    supplier_filter: '',
    status_filter: '',
    cost_type_filter: 'both'
  });
  
  // Estados para filtros avançados
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
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
    fornecedor: '',
    status: '',
    tipo: '',
    valorMin: '',
    valorMax: '',
    dataInicio: '',
    dataFim: '',
    vencimentoInicio: '',
    vencimentoFim: '',
    reference: ''
  });
  
  // Estado para dados de relatório
  const [reportData, setReportData] = useState({
    monthlyData: [],
    statusData: [],
    supplierData: [],
    supplierEvolutionData: []
  });

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingPayable, setEditingPayable] = useState<AccountsPayable | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  
  // Estados da modal de confirmação de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [payableToDelete, setPayableToDelete] = useState<AccountsPayable | null>(null);
  
  // Estados para remover todos
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Estados para abas
  const [activeMainTab, setActiveMainTab] = useState("payables");
  
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
    supplier_id: "", // UUID como string
    category_id: 0,
    account_id: 0, // ID da conta bancária
    payable_type: "cash" as "cash" | "installment",
    total_amount: 0,
    entry_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    notes: "",
    reference: "",
    is_fixed_cost: false,
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
  }, []);

  useEffect(() => {
    if (activeMainTab === "analysis") {
      loadAnalysisData();
    }
  }, [activeMainTab, analysisFilters]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    resetPage();
  }, [searchTerm, filterStatus, filterMonth]);

  // Atualizar dados de relatório quando payables ou filtros mudarem
  useEffect(() => {
    setReportData(processReportData());
  }, [payables, reportPeriod, filtrosRelatorio]);



  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadPayables(),
        loadSummary(),
        loadSuppliers(),
        loadCategories(),
        loadAccounts()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayables = async () => {
    try {
      // Buscar todos os registros (limit=1000 para pegar mais registros)
      const response = await api.get("/api/v1/accounts-payable/?limit=1000");
      setPayables(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas a pagar",
        variant: "destructive"
      });
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get("/api/v1/accounts-payable/reports/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/api/v1/suppliers/");
      // A API retorna {suppliers: [...], total: 1, ...}
      const suppliersData = response.data.suppliers || [];
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/api/v1/payable-categories/");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get("/api/v1/accounts/");
      const accountsData = response.data || [];
      setAccounts(accountsData);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    }
  };

  const loadAnalysisData = async () => {
    try {
      setIsLoadingAnalysis(true);
      
      const params = new URLSearchParams();
      params.append('months_ahead', analysisFilters.months_ahead.toString());
      
      if (analysisFilters.category_filter) {
        params.append('category_filter', analysisFilters.category_filter);
      }
      if (analysisFilters.supplier_filter) {
        params.append('supplier_filter', analysisFilters.supplier_filter);
      }
      if (analysisFilters.status_filter) {
        params.append('status_filter', analysisFilters.status_filter);
      }
      if (analysisFilters.cost_type_filter) {
        params.append('cost_type_filter', analysisFilters.cost_type_filter);
      }
      
      const response = await api.get(`/api/v1/accounts-payable/analysis?${params.toString()}`);
      setAnalysisData(response.data);
    } catch (error) {
      console.error("Erro ao carregar dados de análise:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de análise",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleCreatePayable = () => {
    setEditingPayable(null);
    setIsViewMode(false);
    setIsInstallmentMode(false);
    setActiveTab("basic");
    setFormData({
      description: "",
      supplier_id: "",
      category_id: 0,
      account_id: 0,
      payable_type: "cash",
      total_amount: 0,
      entry_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      notes: "",
      reference: "",
      is_fixed_cost: false,
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

  const handleViewPayable = async (payable: AccountsPayable) => {
    try {
      const response = await api.get(`/api/v1/accounts-payable/${payable.id}`);
      const fullPayable = response.data;
      
      setEditingPayable(fullPayable);
      setFormData({
        description: fullPayable.description,
        supplier_id: fullPayable.supplier_id,
        category_id: fullPayable.category_id || 0,
        account_id: fullPayable.account_id || 0,
        payable_type: fullPayable.payable_type,
        total_amount: fullPayable.total_amount,
        entry_date: fullPayable.entry_date,
        due_date: fullPayable.due_date,
        notes: fullPayable.notes || "",
        reference: fullPayable.reference || "",
        is_fixed_cost: fullPayable.is_fixed_cost || false,
        status: fullPayable.status,
        paid_amount: fullPayable.paid_amount || 0,
        payment_date: fullPayable.payment_date || new Date().toISOString().split('T')[0],
        total_installments: fullPayable.total_installments,
        installment_amount: fullPayable.installment_amount || 0,
        installment_interval_days: 30,
        first_due_date: fullPayable.due_date
      });
      setIsViewMode(true);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da conta a pagar",
        variant: "destructive"
      });
    }
  };

  const handleEditPayable = async (payable: AccountsPayable) => {
    try {
      const response = await api.get(`/api/v1/accounts-payable/${payable.id}`);
      const fullPayable = response.data;
      
      setEditingPayable(fullPayable);
      setFormData({
        description: fullPayable.description,
        supplier_id: fullPayable.supplier_id,
        category_id: fullPayable.category_id || 0,
        account_id: fullPayable.account_id || 0,
        payable_type: fullPayable.payable_type,
        total_amount: fullPayable.total_amount,
        entry_date: fullPayable.entry_date,
        due_date: fullPayable.due_date,
        notes: fullPayable.notes || "",
        reference: fullPayable.reference || "",
        is_fixed_cost: fullPayable.is_fixed_cost || false,
        status: fullPayable.status,
        paid_amount: fullPayable.paid_amount || 0,
        payment_date: fullPayable.payment_date || new Date().toISOString().split('T')[0],
        total_installments: fullPayable.total_installments,
        installment_amount: fullPayable.installment_amount || 0,
        installment_interval_days: 30,
        first_due_date: fullPayable.due_date
      });
      setIsViewMode(false);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da conta a pagar",
        variant: "destructive"
      });
    }
  };

  const handleSavePayable = async () => {
    try {
      if (isInstallmentMode) {
        // Debug: verificar valores
        console.log("Debug - formData:", formData);
        console.log("Debug - supplier_id:", formData.supplier_id);
        console.log("Debug - supplier_id type:", typeof formData.supplier_id);
        console.log("Debug - isInstallmentMode:", isInstallmentMode);
        console.log("Debug - payable_type:", formData.payable_type);
        console.log("Debug - total_installments:", formData.total_installments);
        
        // Validar campos obrigatórios
        if (!formData.supplier_id || formData.supplier_id === "") {
          console.log("Debug - Validação falhou: supplier_id vazio");
          toast({
            title: "Erro",
            description: "Fornecedor é obrigatório",
            variant: "destructive"
          });
          return;
        }
        
        // Criar parcelamento
        const installmentData = {
          description: formData.description,
          supplier_id: formData.supplier_id,
          category_id: formData.category_id === 0 ? null : formData.category_id,
          account_id: formData.account_id === 0 ? null : formData.account_id,
          total_amount: formData.total_amount,
          total_installments: formData.total_installments,
          installment_amount: formData.installment_amount || null,
          entry_date: formData.entry_date,
          first_due_date: formData.first_due_date,
          installment_interval_days: formData.installment_interval_days,
          notes: formData.notes,
          reference: formData.reference,
          is_fixed_cost: formData.is_fixed_cost
        };
        
        await api.post("/api/v1/accounts-payable/installments", installmentData);
        toast({
          title: "Sucesso",
          description: "Parcelamento criado com sucesso"
        });
      } else {
        // Criar conta única
        if (editingPayable) {
          // Preparar dados para envio, convertendo category_id 0 para null
          const updateData = { ...formData };
          if (updateData.category_id === 0) {
            updateData.category_id = null;
          }
          if (updateData.account_id === 0) {
            updateData.account_id = null;
          }
          if (updateData.supplier_id === "") {
            updateData.supplier_id = null;
          }
          
          await api.put(`/api/v1/accounts-payable/${editingPayable.id}`, updateData);
          toast({
            title: "Sucesso",
            description: "Conta a pagar atualizada com sucesso"
          });
        } else {
          // Preparar dados para envio, convertendo category_id 0 para null
          const createData = { ...formData };
          if (createData.category_id === 0) {
            createData.category_id = null;
          }
          if (createData.account_id === 0) {
            createData.account_id = null;
          }
          if (createData.supplier_id === "") {
            createData.supplier_id = null;
          }
          
          await api.post("/api/v1/accounts-payable/", createData);
          toast({
            title: "Sucesso",
            description: "Conta a pagar criada com sucesso"
          });
        }
      }
      
      setIsModalOpen(false);
      setEditingPayable(null);
      setIsViewMode(false);
      setIsInstallmentMode(false);
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar conta a pagar:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao salvar conta a pagar",
        variant: "destructive"
      });
    }
  };

  const handleDeletePayable = (payable: AccountsPayable) => {
    setPayableToDelete(payable);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePayable = async () => {
    if (!payableToDelete) return;

    try {
      await api.delete(`/api/v1/accounts-payable/${payableToDelete.id}`);
      
      toast({
        title: "Sucesso",
        description: "Conta a pagar deletada com sucesso"
      });
      
      setIsDeleteModalOpen(false);
      setPayableToDelete(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao deletar conta a pagar:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao deletar conta a pagar",
        variant: "destructive"
      });
    }
  };

  // Função para remover todos os lançamentos
  const handleDeleteAllPayables = () => {
    setIsDeleteAllModalOpen(true);
  };

  const confirmDeleteAllPayables = async () => {
    try {
      await api.delete("/api/v1/accounts-payable/");
      toast({
        title: "Sucesso",
        description: "Todas as contas a pagar foram excluídas com sucesso"
      });
      setIsDeleteAllModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Erro ao excluir todas as contas a pagar:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao excluir todas as contas a pagar",
        variant: "destructive"
      });
    }
  };

  const handleQuickStatusChange = async (payable: AccountsPayable, newStatus: "pending" | "paid" | "overdue" | "cancelled") => {
    try {
      const updateData: any = { status: newStatus };
      
      // Se mudando para pago, definir valor pago e data
      if (newStatus === "paid") {
        updateData.paid_amount = payable.total_amount;
        updateData.payment_date = new Date().toISOString().split('T')[0];
      } else if (newStatus === "pending") {
        // Se voltando para pendente, zerar valor pago
        updateData.paid_amount = 0;
        updateData.payment_date = null;
      }
      
      // Não enviar category_id se for 0 (sem categoria)
      if (payable.category_id === 0) {
        updateData.category_id = null;
      }
      
      await api.put(`/api/v1/accounts-payable/${payable.id}`, updateData);
      
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

  // Função para resetar página quando filtros mudarem
  const resetPage = () => {
    setCurrentPage(1);
  };

  // Função para calcular estatísticas filtradas
  const calculateFilteredStats = () => {
    const filteredData = applyFilters(payables);
    
    const total_payable = filteredData.reduce((sum, payable) => {
      const amount = Number(payable.total_amount) || 0;
      return sum + amount;
    }, 0);
    
    const total_paid = filteredData.reduce((sum, payable) => {
      const amount = Number(payable.paid_amount) || 0;
      return sum + amount;
    }, 0);
    
    const total_overdue = filteredData.filter(payable => payable.is_overdue).reduce((sum, payable) => {
      const remaining = getRemainingAmount(payable);
      const amount = Number(remaining) || 0;
      return sum + amount;
    }, 0);
    
    const total_pending = filteredData.filter(payable => payable.status === 'pending').reduce((sum, payable) => {
      const remaining = getRemainingAmount(payable);
      const amount = Number(remaining) || 0;
      return sum + amount;
    }, 0);
    

    
    return {
      total_payable,
      total_paid,
      total_overdue,
      total_pending
    };
  };

  // Função para obter valor seguro do summary
  const getSummaryValue = (key: keyof AccountsPayableSummary, defaultValue: number = 0) => {
    return summary ? summary[key] : defaultValue;
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      supplier: '',
      category: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      tipo: '',
      reference: ''
    });
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMonth(new Date().toISOString().slice(0, 7)); // Voltar para mês atual
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
           filterStatus !== 'all' || 
           filterMonth !== currentMonth;
  };

  const aplicarFiltrosRelatorio = (dados: any[]) => {
    console.log('🔍 Aplicando filtros de relatório:', filtrosRelatorio);
    console.log('📊 Dados antes dos filtros:', dados.length);
    
    const dadosFiltrados = dados.filter(payable => {
      // Filtro por categoria
      if (filtrosRelatorio.categoria && payable.category_id?.toString() !== filtrosRelatorio.categoria) {
        return false;
      }
      
      // Filtro por subcategoria (categoria filha)
      if (filtrosRelatorio.subcategoria && payable.category_id?.toString() !== filtrosRelatorio.subcategoria) {
        return false;
      }
      
      // Filtro por fornecedor
              if (filtrosRelatorio.fornecedor && !getSupplierName(payable.supplier_id).toLowerCase().includes(filtrosRelatorio.fornecedor.toLowerCase())) {
        return false;
      }
      
      // Filtro por status
      if (filtrosRelatorio.status && payable.status !== filtrosRelatorio.status) {
        return false;
      }
      
      // Filtro por tipo
      if (filtrosRelatorio.tipo && payable.payable_type !== filtrosRelatorio.tipo) {
        return false;
      }
      
      // Filtro por valor mínimo
      if (filtrosRelatorio.valorMin && (Number(payable.total_amount) || 0) < parseFloat(filtrosRelatorio.valorMin)) {
        return false;
      }
      
      // Filtro por valor máximo
      if (filtrosRelatorio.valorMax && (Number(payable.total_amount) || 0) > parseFloat(filtrosRelatorio.valorMax)) {
        return false;
      }
      
      // Filtro por data de entrada início
      if (filtrosRelatorio.dataInicio) {
        const dataEntrada = new Date(payable.entry_date);
        const dataInicio = new Date(filtrosRelatorio.dataInicio);
        if (dataEntrada < dataInicio) {
          return false;
        }
      }
      
      // Filtro por data de entrada fim
      if (filtrosRelatorio.dataFim) {
        const dataEntrada = new Date(payable.entry_date);
        const dataFim = new Date(filtrosRelatorio.dataFim);
        if (dataEntrada > dataFim) {
          return false;
        }
      }
      
      // Filtro por referência
      if (filtrosRelatorio.reference && !payable.reference?.toLowerCase().includes(filtrosRelatorio.reference.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    console.log('📊 Dados após filtros de relatório:', dadosFiltrados.length);
    return dadosFiltrados;
  };

  const limparFiltrosRelatorio = () => {
    setFiltrosRelatorio({
      categoria: '',
      subcategoria: '',
      fornecedor: '',
      status: '',
      tipo: '',
      valorMin: '',
      valorMax: '',
      dataInicio: '',
      dataFim: '',
      vencimentoInicio: '',
      vencimentoFim: '',
      reference: ''
    });
  };

  const hasActiveFiltersRelatorio = () => {
    return Object.values(filtrosRelatorio).some(value => value !== '');
  };

  // Função para aplicar filtros
  const applyFilters = (data: any[]) => {
    if (!data || !Array.isArray(data)) {
      console.log("❌ Dados inválidos para filtro:", data);
      return [];
    }
    
    console.log("🔍 Aplicando filtros em", data.length, "registros");
    console.log("🔍 Filtros ativos:", { searchTerm, filterStatus, filterMonth, filters });
    
    const filteredData = data.filter(payable => {
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          payable.description?.toLowerCase().includes(searchLower) ||
          getSupplierName(payable.supplier_id).toLowerCase().includes(searchLower) ||
          (payable.category_id ? categories.find(c => c.id === payable.category_id)?.name?.toLowerCase().includes(searchLower) : false) ||
          payable.reference?.toLowerCase().includes(searchLower) ||
          payable.notes?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          console.log("❌ Filtrado por busca:", payable.description);
          return false;
        }
      }

      // Filtro por status
      if (filterStatus && filterStatus !== "all" && payable.status !== filterStatus) {
        console.log("❌ Filtrado por status:", payable.description, "status:", payable.status, "filtro:", filterStatus);
        return false;
      }

      // Filtro por mês de vencimento
      if (filterMonth) {
        const dueDate = new Date(payable.due_date);
        const filterYear = parseInt(filterMonth.split('-')[0]);
        const filterMonthNum = parseInt(filterMonth.split('-')[1]);
        
        if (dueDate.getFullYear() !== filterYear || (dueDate.getMonth() + 1) !== filterMonthNum) {
          console.log("❌ Filtrado por mês:", payable.description, "vencimento:", payable.due_date, "filtro:", filterMonth);
          return false;
        }
      }

      // Filtros avançados
      if (filters.status && payable.status !== filters.status) {
        console.log("❌ Filtrado por status avançado:", payable.description);
        return false;
      }

      if (filters.supplier && !getSupplierName(payable.supplier_id).toLowerCase().includes(filters.supplier.toLowerCase())) {
        console.log("❌ Filtrado por fornecedor:", payable.description);
        return false;
      }

      if (filters.category && payable.category_id?.toString() !== filters.category) {
        console.log("❌ Filtrado por categoria:", payable.description);
        return false;
      }

      if (filters.tipo && payable.payable_type !== filters.tipo) {
        console.log("❌ Filtrado por tipo:", payable.description);
        return false;
      }

      if (filters.valorMin && (Number(payable.total_amount) || 0) < parseFloat(filters.valorMin)) {
        console.log("❌ Filtrado por valor mínimo:", payable.description);
        return false;
      }

      if (filters.valorMax && (Number(payable.total_amount) || 0) > parseFloat(filters.valorMax)) {
        console.log("❌ Filtrado por valor máximo:", payable.description);
        return false;
      }

      if (filters.dataInicio) {
        const dataEntrada = new Date(payable.entry_date);
        const dataInicio = new Date(filters.dataInicio);
        if (dataEntrada < dataInicio) {
          console.log("❌ Filtrado por data início:", payable.description);
          return false;
        }
      }

      if (filters.dataFim) {
        const dataEntrada = new Date(payable.entry_date);
        const dataFim = new Date(filters.dataFim);
        if (dataEntrada > dataFim) {
          console.log("❌ Filtrado por data fim:", payable.description);
          return false;
        }
      }

      if (filters.reference && !payable.reference?.toLowerCase().includes(filters.reference.toLowerCase())) {
        console.log("❌ Filtrado por referência:", payable.description);
        return false;
      }

      console.log("✅ Passou por todos os filtros:", payable.description);
      return true;
    });
    
    console.log("📊 Resultado após filtros:", filteredData.length, "registros");
    return filteredData;
  };

  // Função para processar dados de relatório
  const processReportData = () => {
    if (!payables.length) {
      return {
        monthlyData: [],
        statusData: [],
        supplierData: [],
        supplierEvolutionData: []
      };
    }

    // Filtrar dados por período
    let filteredData = [...payables];
    
    if (reportPeriod !== 'todos') {
      const now = new Date();
      let startDate = new Date();
      
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
      }
      
      filteredData = payables.filter(payable => 
        new Date(payable.entry_date) >= startDate
      );
    }

    // Aplicar filtros de relatório
    filteredData = aplicarFiltrosRelatorio(filteredData);

    // Dados mensais
    const monthlyData = filteredData.reduce((acc, payable) => {
      const month = new Date(payable.entry_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const existingMonth = acc.find(item => item.month === month);
      
      if (existingMonth) {
        existingMonth.total += Number(payable.total_amount) || 0;
        if (payable.status === 'paid') {
          existingMonth.paid += Number(payable.paid_amount) || 0;
        } else if (payable.status === 'pending') {
          existingMonth.pending += getRemainingAmount(payable);
        }
      } else {
        acc.push({
          month,
          total: Number(payable.total_amount) || 0,
          paid: payable.status === 'paid' ? Number(payable.paid_amount) || 0 : 0,
          pending: payable.status === 'pending' ? getRemainingAmount(payable) : 0
        });
      }
      
      return acc;
    }, [] as any[]);

    // Dados por status
    const statusCounts = filteredData.reduce((acc, payable) => {
      acc[payable.status] = (acc[payable.status] || 0) + 1;
      return acc;
    }, {} as any);

    const statusData = [
      { name: 'Pendente', value: statusCounts.pending || 0, color: '#ffc658' },
      { name: 'Pago', value: statusCounts.paid || 0, color: '#82ca9d' },
      { name: 'Vencido', value: statusCounts.overdue || 0, color: '#ff6b6b' },
      { name: 'Cancelado', value: statusCounts.cancelled || 0, color: '#8884d8' }
    ].filter(item => item.value > 0);

    // Top fornecedores
    const supplierTotals = filteredData.reduce((acc, payable) => {
              acc[getSupplierName(payable.supplier_id)] = (acc[getSupplierName(payable.supplier_id)] || 0) + (Number(payable.total_amount) || 0);
      return acc;
    }, {} as any);

    const supplierData = Object.entries(supplierTotals)
      .map(([supplier, total]) => ({ supplier, total }))
      .sort((a, b) => (b.total as number) - (a.total as number))
      .slice(0, 10);

    // Evolução por fornecedor
    const supplierEvolutionData = filteredData.reduce((acc, payable) => {
      const month = new Date(payable.entry_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const existingMonth = acc.find(item => item.month === month);
      
      if (existingMonth) {
        if (existingMonth[getSupplierName(payable.supplier_id)]) {
          existingMonth[getSupplierName(payable.supplier_id)] += Number(payable.total_amount) || 0;
        } else {
          existingMonth[getSupplierName(payable.supplier_id)] = Number(payable.total_amount) || 0;
        }
      } else {
        const newMonth: any = { month };
        newMonth[getSupplierName(payable.supplier_id)] = Number(payable.total_amount) || 0;
        acc.push(newMonth);
      }
      
      return acc;
    }, [] as any[]);

    return {
      monthlyData,
      statusData,
      supplierData,
      supplierEvolutionData
    };
  };

  // Função para ordenar dados
  const sortData = (data: any[]) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Tratar valores especiais
      if (sortField === 'total_amount' || sortField === 'paid_amount' || sortField === 'remaining_amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'due_date' || sortField === 'entry_date' || sortField === 'payment_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getPaginatedData = () => {
    console.log("🔍 getPaginatedData - payables:", payables?.length || 0);
    const filteredData = applyFilters(payables || []);
    console.log("🔍 getPaginatedData - após filtros:", filteredData.length);
    const sortedData = sortData(filteredData);
    console.log("🔍 getPaginatedData - após ordenação:", sortedData.length);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    console.log("🔍 getPaginatedData - paginados:", paginatedData.length, "página:", currentPage);
    return paginatedData;
  };

  const getTotalPages = () => {
    const filteredData = applyFilters(payables || []);
    return Math.ceil(filteredData.length / itemsPerPage);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-0" />;
    }
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
      if (!categoryFormData.name || !categoryFormData.code) {
        toast({
          title: "Erro",
          description: "Nome e código são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      if (editingCategory) {
        await api.put(`/api/v1/payable-categories/${editingCategory.id}`, categoryFormData);
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso"
        });
      } else {
        await api.post("/api/v1/payable-categories/", categoryFormData);
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
        description: "Não foi possível salvar a categoria",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await api.delete(`/api/v1/payable-categories/${categoryId}`);
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      });
      loadCategories();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria",
        variant: "destructive"
      });
    }
  };

  // Funções auxiliares
  const getRemainingAmount = (payable: AccountsPayable) => {
    const totalAmount = Number(payable.total_amount) || 0;
    const paidAmount = Number(payable.paid_amount) || 0;
    return totalAmount - paidAmount;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : "Fornecedor não encontrado";
  };

  // Função para calcular o valor total do parcelamento
  const getInstallmentTotalAmount = (payable: AccountsPayable) => {
    if (payable.payable_type === 'installment' && payable.total_installments > 1) {
      // Para parcelas, o total é o valor da parcela multiplicado pelo número total de parcelas
      const installmentAmount = parseFloat(payable.total_amount.toString());
      const totalInstallments = parseInt(payable.total_installments.toString());
      return installmentAmount * totalInstallments;
    }
    return parseFloat(payable.total_amount.toString());
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Controle de despesas e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDeleteAllPayables}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Todas
          </Button>
          <Button onClick={handleCreatePayable}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Abas principais */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-4 w-4 mr-2" />
            Análise
          </TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Aba Contas a Pagar */}
        <TabsContent value="payables" className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(calculateFilteredStats().total_payable)}
                </div>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pago</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateFilteredStats().total_paid)}
                </div>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(calculateFilteredStats().total_overdue)}
                </div>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(calculateFilteredStats().total_pending)}
                </div>
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="mt-1">Filtrado</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filtros e busca */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, fornecedor, categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
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
                <div className="flex flex-col gap-1">
                  <Input
                    id="filter-month"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full md:w-[180px]"
                  />
                </div>
                <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avançados
                </Button>
                {hasActiveFilters() && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                {getPaginatedData().length} de {applyFilters(payables).length} contas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                        <div className="flex items-center gap-2">
                          Descrição
                          {getSortIcon('description')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('supplier_name')}>
                        <div className="flex items-center gap-2">
                          Fornecedor
                          {getSortIcon('supplier_name')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('category_name')}>
                        <div className="flex items-center gap-2">
                          Categoria
                          {getSortIcon('category_name')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('total_amount')}>
                        <div className="flex items-center gap-2">
                          Valor
                          {getSortIcon('total_amount')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('due_date')}>
                        <div className="flex items-center gap-2">
                          Vencimento
                          {getSortIcon('due_date')}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Carregando...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : getPaginatedData().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhuma conta a pagar encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedData().map((payable) => (
                        <TableRow key={payable.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payable.description}</div>
                              {payable.reference && (
                                <div className="text-sm text-muted-foreground">Ref: {payable.reference}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getSupplierName(payable.supplier_id)}</TableCell>
                          <TableCell>{payable.category_id ? categories.find(c => c.id === payable.category_id)?.name || '-' : '-'}</TableCell>
                          <TableCell>
                            <div>
                              {payable.payable_type === 'installment' && payable.total_installments > 1 ? (
                                <>
                                  <div className="font-medium">
                                                                  {formatCurrency(parseFloat(payable.total_amount.toString()))} {payable.installment_number}/{payable.total_installments}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total: {formatCurrency(getInstallmentTotalAmount(payable))}
                                  </div>
                                </>
                              ) : (
                                <div className="font-medium">
                                  {formatCurrency(parseFloat(payable.total_amount.toString()))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{new Date(payable.due_date).toLocaleDateString('pt-BR')}</div>
                              {payable.is_overdue && (
                                <div className="text-sm text-red-600 font-medium">Vencido</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(payable.status)}
                              <Select
                                value={payable.status}
                                onValueChange={(value) => handleQuickStatusChange(payable, value as any)}
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
                                onClick={() => handleViewPayable(payable)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPayable(payable)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePayable(payable)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {getTotalPages() > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {getTotalPages()}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Análise */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Filtros de Análise */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Filtros de Análise</CardTitle>
                  <CardDescription>Configure os parâmetros para análise e previsão</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysisFilters({
                    months_ahead: 6,
                    category_filter: '',
                    supplier_filter: '',
                    status_filter: '',
                    cost_type_filter: 'both'
                  })}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Meses à Frente</Label>
                  <Select 
                    value={analysisFilters.months_ahead.toString()} 
                    onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, months_ahead: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="9">9 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={analysisFilters.category_filter} 
                    onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, category_filter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Select 
                    value={analysisFilters.supplier_filter} 
                    onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, supplier_filter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={analysisFilters.status_filter} 
                    onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, status_filter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Custo</Label>
                  <Select 
                    value={analysisFilters.cost_type_filter} 
                    onValueChange={(value) => setAnalysisFilters(prev => ({ ...prev, cost_type_filter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Ambos</SelectItem>
                      <SelectItem value="fixed">Apenas Fixos</SelectItem>
                      <SelectItem value="variable">Apenas Variáveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingAnalysis ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando análise...</span>
              </CardContent>
            </Card>
          ) : analysisData ? (
            <>
              {/* Cards de Resumo da Análise */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisData.summary.total_analysis_period)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Próximos {analysisFilters.months_ahead} meses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendente no Período</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisData.summary.total_pending_period)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A vencer no período
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Previsão 30 Dias</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysisData.summary.total_forecast_30_days)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysisData.forecast.length} contas a vencer
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Maior Categoria</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate">
                      {analysisData.summary.top_category || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Top supplier: {analysisData.summary.top_supplier || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolução Mensal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução Mensal</CardTitle>
                    <CardDescription>Valores por mês (atual + próximos {analysisFilters.months_ahead} meses)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[analysisData.current_month, ...analysisData.next_months].map(month => ({
                        month: `${month.month.slice(0, 3)}/${month.year}`,
                        total: month.total_amount,
                        pendente: month.pending_amount,
                        pago: month.paid_amount,
                        vencido: month.overdue_amount
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="pago" stackId="a" fill="#82ca9d" name="Pago" />
                        <Bar dataKey="pendente" stackId="a" fill="#ffc658" name="Pendente" />
                        <Bar dataKey="vencido" stackId="a" fill="#ff6b6b" name="Vencido" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribuição por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                    <CardDescription>Percentual por categoria no período</CardDescription>
                  </CardHeader>
                  <CardContent>

                                          {analysisData.categories && analysisData.categories.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={analysisData.categories.slice(0, 8).map((cat, index) => ({
                                name: cat.category_name || 'Sem Categoria',
                                value: Number(cat.total_amount) || 0,
                                percentage: cat.percentage || 0,
                                id: cat.category_id || `no-category-${index}`
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percentage }) => `${name} ${percentage?.toFixed(1) || 0}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {analysisData.categories.slice(0, 8).map((entry, index) => {
                                const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87ceeb', '#ffb347'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum dado de categoria encontrado</p>
                          <p className="text-sm">Verifique se há contas a pagar no período selecionado</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Fornecedores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Fornecedores</CardTitle>
                    <CardDescription>Maiores valores por fornecedor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisData.suppliers.slice(0, 10).map(sup => ({
                        supplier: sup.supplier_name.length > 15 ? sup.supplier_name.slice(0, 15) + '...' : sup.supplier_name,
                        total: sup.total_amount,
                        percentage: sup.percentage
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="supplier" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(label) => analysisData.suppliers.find(s => s.supplier_name.startsWith(label.replace('...', '')))?.supplier_name || label}
                        />
                        <Bar dataKey="total" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Previsão de Caixa (30 dias) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Previsão de Caixa - 30 Dias</CardTitle>
                    <CardDescription>Contas a vencer nos próximos 30 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {analysisData.forecast.length > 0 ? (
                        analysisData.forecast.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{item.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.supplier_name} • {new Date(item.date).toLocaleDateString('pt-BR')}
                                {item.is_fixed_cost && (
                                  <Badge variant="outline" className="ml-2 text-xs">Fixo</Badge>
                                )}
                              </div>
                              {item.category_name && (
                                <div className="text-xs text-muted-foreground">{item.category_name}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.ceil((new Date(item.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma conta a vencer nos próximos 30 dias
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabelas de Análise */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumo por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo por Categoria</CardTitle>
                    <CardDescription>Detalhamento por categoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.categories.slice(0, 10).map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b">
                          <div>
                            <div className="font-medium">{category.category_name}</div>
                            <div className="text-sm text-muted-foreground">{category.count} contas</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {formatCurrency(category.total_amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {category.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo por Fornecedor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo por Fornecedor</CardTitle>
                    <CardDescription>Detalhamento por fornecedor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.suppliers.slice(0, 10).map((supplier, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b">
                          <div>
                            <div className="font-medium">{supplier.supplier_name}</div>
                            <div className="text-sm text-muted-foreground">{supplier.count} contas</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {formatCurrency(supplier.total_amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum dado de análise disponível</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Gerencie as categorias de contas a pagar</CardDescription>
                </div>
                <Button onClick={handleCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Contas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 && categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.code}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>{category.payables_count}</TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Filtros Avançados */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtros Avançados</DialogTitle>
            <DialogDescription>
              Configure filtros específicos para as contas a pagar
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input
                placeholder="Buscar fornecedor..."
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories && categories.length > 0 && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cash">À Vista</SelectItem>
                  <SelectItem value="installment">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.valorMin}
                onChange={(e) => setFilters(prev => ({ ...prev, valorMin: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valor Máximo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.valorMax}
                onChange={(e) => setFilters(prev => ({ ...prev, valorMax: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data de Entrada (Início)</Label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data de Entrada (Fim)</Label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div>
              <Label>Referência</Label>
              <Input
                placeholder="Buscar por referência..."
                value={filters.reference}
                onChange={(e) => setFilters(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? 'Visualizar Conta a Pagar' : editingPayable ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Detalhes da conta a pagar' : 'Preencha as informações da conta a pagar'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="payment">Pagamento</TabsTrigger>
              <TabsTrigger value="installment">Parcelamento</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Descrição da conta a pagar"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers && suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Nenhum fornecedor disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: parseInt(value) || 0 }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem categoria</SelectItem>
                      {categories && categories.length > 0 && categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account">Forma de Pagamento</Label>
                  <Select
                    value={formData.account_id.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: parseInt(value) || 0 }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem forma de pagamento</SelectItem>
                      
                      {/* Contas Bancárias */}
                      {accounts && accounts.filter(account => 
                        account.account_type === 'checking' || 
                        account.account_type === 'savings' || 
                        account.account_type === 'investment'
                      ).length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel>Contas Bancárias</SelectLabel>
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
                          </SelectGroup>
                        </>
                      )}
                      
                      {/* Cartões de Crédito */}
                      {accounts && accounts.filter(account => account.account_type === 'credit').length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel>Cartões de Crédito</SelectLabel>
                            {accounts
                              .filter(account => account.account_type === 'credit')
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  💳 {account.bank_name} - Final {account.account_number.slice(-4)} ({account.holder_name})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </>
                      )}
                      
                      {/* Cartões de Débito */}
                      {accounts && accounts.filter(account => account.account_type === 'debit').length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel>Cartões de Débito</SelectLabel>
                            {accounts
                              .filter(account => account.account_type === 'debit')
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  💳 {account.bank_name} - Final {account.account_number.slice(-4)} ({account.holder_name})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.payable_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payable_type: value as "cash" | "installment" }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total_amount">Valor Total *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                    disabled={isViewMode}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="entry_date">Data de Entrada *</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Referência</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Referência externa"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_fixed_cost"
                    checked={formData.is_fixed_cost}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_fixed_cost: checked }))}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="is_fixed_cost" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Custo Fixo
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isViewMode}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
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
                  <Label htmlFor="paid_amount">Valor Pago</Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: parseFloat(e.target.value) || 0 }))}
                    disabled={isViewMode}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_date">Data do Pagamento</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="installment" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="installment-mode"
                  checked={isInstallmentMode}
                  onCheckedChange={(checked) => {
                    setIsInstallmentMode(checked);
                    if (checked) {
                      setFormData(prev => ({ ...prev, payable_type: "installment" }));
                    } else {
                      setFormData(prev => ({ ...prev, payable_type: "cash" }));
                    }
                  }}
                  disabled={isViewMode}
                />
                <Label htmlFor="installment-mode">Criar parcelamento</Label>
              </div>

              {isInstallmentMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_installments">Total de Parcelas</Label>
                    <Input
                      id="total_installments"
                      type="number"
                      min="2"
                      value={formData.total_installments}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_installments: parseInt(e.target.value) || 1 }))}
                      disabled={isViewMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installment_amount">Valor da Parcela</Label>
                    <Input
                      id="installment_amount"
                      type="number"
                      step="0.01"
                      value={formData.installment_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, installment_amount: parseFloat(e.target.value) || 0 }))}
                      disabled={isViewMode}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="first_due_date">Data de Vencimento da Primeira Parcela</Label>
                    <Input
                      id="first_due_date"
                      type="date"
                      value={formData.first_due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_due_date: e.target.value }))}
                      disabled={isViewMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installment_interval">Intervalo entre Parcelas (dias)</Label>
                    <Input
                      id="installment_interval"
                      type="number"
                      min="1"
                      value={formData.installment_interval_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, installment_interval_days: parseInt(e.target.value) || 30 }))}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ative o modo parcelamento para configurar as parcelas
                </div>
              )}
            </TabsContent>
          </Tabs>

          {!isViewMode && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePayable}>
                {editingPayable ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Categoria */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label htmlFor="category-code">Código *</Label>
              <Input
                id="category-code"
                value={categoryFormData.code}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Código da categoria"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da categoria"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category-parent">Categoria Pai</Label>
              <Select
                value={categoryFormData.parent_id?.toString() || ""}
                onValueChange={(value) => setCategoryFormData(prev => ({ ...prev, parent_id: value ? parseInt(value) : null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (categoria principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (categoria principal)</SelectItem>
                  {categories.filter(c => !c.parent_id).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={categoryFormData.is_active}
                onCheckedChange={(checked) => setCategoryFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="category-active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta a pagar "{payableToDelete?.description}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeletePayable}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Todas */}
      <Dialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão de Todas</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir TODAS as contas a pagar?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAllPayables}>
              Excluir Todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}