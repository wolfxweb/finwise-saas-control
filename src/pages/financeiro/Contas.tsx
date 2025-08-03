import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Banknote,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { api } from '@/services/api';

// Interfaces
interface Bank {
  id: string;
  name: string;
  code: string;
  website?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
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

interface AccountSummary {
  // Contas Bancárias
  bank_accounts: number;
  bank_balance: number;
  bank_limit: number;
  bank_available: number;
  bank_active: number;
  bank_inactive: number;
  
  // Cartões
  card_accounts: number;
  card_balance: number;
  card_limit: number;
  card_available: number;
  card_active: number;
  card_inactive: number;
  
  // Totais
  total_accounts: number;
  total_balance: number;
  total_limit: number;
  total_available: number;
  active_accounts: number;
  inactive_accounts: number;
}

export default function Contas() {
  const { toast } = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBank, setFilterBank] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Estados para modais
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCard, setEditingCard] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("banks");
  
  // Estados para formulários
  const [bankFormData, setBankFormData] = useState({
    name: "",
    code: "",
    website: "",
    phone: "",
    is_active: true
  });
  
  const [accountFormData, setAccountFormData] = useState({
    bank_id: "",
    account_type: "checking" as "checking" | "savings" | "investment" | "credit" | "debit",
    account_number: "",
    agency: "",
    holder_name: "",
    balance: 0,
    limit: 0,
    is_active: true,
    notes: ""
  });

  // Estados para confirmação de exclusão
  const [isDeleteBankModalOpen, setIsDeleteBankModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Bank | Account | null>(null);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  // Recalcular resumo sempre que as contas mudarem
  useEffect(() => {
    loadSummary();
  }, [accounts]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadBanks(),
        loadAccounts()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await api.get("/api/v1/banks/");
      setBanks(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os bancos",
        variant: "destructive"
      });
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get("/api/v1/accounts/");
      const accountsData = response.data || [];
      console.log('Contas carregadas:', accountsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive"
      });
    }
  };

  const loadSummary = () => {
    try {
      // Calcular resumo baseado nas contas carregadas
      const bankAccounts = accounts.filter(acc => 
        acc.account_type === 'checking' || acc.account_type === 'savings' || acc.account_type === 'investment'
      );
      const cardAccounts = accounts.filter(acc => 
        acc.account_type === 'credit' || acc.account_type === 'debit'
      );

      // Função auxiliar para somar valores com tratamento de NaN/null
      const safeSum = (values: number[]): number => {
        return values.reduce((sum, value) => {
          const numValue = Number(value) || 0;
          return sum + numValue;
        }, 0);
      };

      const summaryData: AccountSummary = {
        // Contas Bancárias
        bank_accounts: bankAccounts.length,
        bank_balance: safeSum(bankAccounts.map(acc => acc.balance)),
        bank_limit: safeSum(bankAccounts.map(acc => acc.limit)),
        bank_available: safeSum(bankAccounts.map(acc => acc.available_balance)),
        bank_active: bankAccounts.filter(acc => acc.is_active).length,
        bank_inactive: bankAccounts.filter(acc => !acc.is_active).length,
        
        // Cartões
        card_accounts: cardAccounts.length,
        card_balance: safeSum(cardAccounts.map(acc => acc.balance)),
        card_limit: safeSum(cardAccounts.map(acc => acc.limit)),
        card_available: safeSum(cardAccounts.map(acc => acc.available_balance)),
        card_active: cardAccounts.filter(acc => acc.is_active).length,
        card_inactive: cardAccounts.filter(acc => !acc.is_active).length,
        
        // Totais
        total_accounts: accounts.length,
        total_balance: safeSum(accounts.map(acc => acc.balance)),
        total_limit: safeSum(accounts.map(acc => acc.limit)),
        total_available: safeSum(accounts.map(acc => acc.available_balance)),
        active_accounts: accounts.filter(acc => acc.is_active).length,
        inactive_accounts: accounts.filter(acc => !acc.is_active).length
      };

      console.log('Resumo calculado:', summaryData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Erro ao calcular resumo:", error);
    }
  };

  // Funções para Bancos
  const handleCreateBank = () => {
    setEditingBank(null);
    setIsViewMode(false);
    setBankFormData({
      name: "",
      code: "",
      website: "",
      phone: "",
      is_active: true
    });
    setIsBankModalOpen(true);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setIsViewMode(false);
    setBankFormData({
      name: bank.name,
      code: bank.code,
      website: bank.website || "",
      phone: bank.phone || "",
      is_active: bank.is_active
    });
    setIsBankModalOpen(true);
  };

  const handleViewBank = (bank: Bank) => {
    setEditingBank(bank);
    setIsViewMode(true);
    setBankFormData({
      name: bank.name,
      code: bank.code,
      website: bank.website || "",
      phone: bank.phone || "",
      is_active: bank.is_active
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async () => {
    try {
      if (editingBank) {
        await api.put(`/api/v1/banks/${editingBank.id}`, bankFormData);
        toast({
          title: "Sucesso",
          description: "Banco atualizado com sucesso"
        });
      } else {
        await api.post("/api/v1/banks/", bankFormData);
        toast({
          title: "Sucesso",
          description: "Banco criado com sucesso"
        });
      }
      setIsBankModalOpen(false);
      loadBanks();
    } catch (error) {
      console.error("Erro ao salvar banco:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar banco",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBank = (bank: Bank) => {
    setItemToDelete(bank);
    setIsDeleteBankModalOpen(true);
  };

  const confirmDeleteBank = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/api/v1/banks/${itemToDelete.id}`);
      toast({
        title: "Sucesso",
        description: "Banco excluído com sucesso"
      });
      setIsDeleteBankModalOpen(false);
      setItemToDelete(null);
      loadBanks();
    } catch (error) {
      console.error("Erro ao excluir banco:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir banco",
        variant: "destructive"
      });
    }
  };

  // Funções para Contas
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setIsViewMode(false);
    setAccountFormData({
      bank_id: "",
      account_type: "checking",
      account_number: "",
      agency: "",
      holder_name: "",
      balance: 0,
      limit: 0,
      is_active: true,
      notes: ""
    });
    setIsAccountModalOpen(true);
  };

  const handleAccountTypeChange = (newType: string) => {
    setAccountFormData(prev => ({
      ...prev,
      account_type: newType as 'checking' | 'savings' | 'investment' | 'credit' | 'debit',
      // Limpar campos específicos quando mudar o tipo
      account_number: "",
      agency: (newType === 'credit' || newType === 'debit') ? 'N/A' : "",
      holder_name: ""
    }));
  };

  // Funções para Cartões
  const handleCreateCard = () => {
    setEditingCard(null);
    setIsViewMode(false);
    setAccountFormData({
      bank_id: "",
      account_type: "credit",
      account_number: "",
      agency: "N/A",
      holder_name: "",
      balance: 0,
      limit: 0,
      is_active: true,
      notes: ""
    });
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: Account) => {
    setEditingCard(card);
    setIsViewMode(false);
    
    // Garantir que bank_id seja string para compatibilidade com o Select
    const bankId = String(card.bank_id);
    
    console.log('Editando cartão:', {
      card_id: card.id,
      bank_id: card.bank_id,
      bank_id_string: bankId,
      bank_name: card.bank_name
    });
    
    setAccountFormData({
      bank_id: bankId,
      account_type: card.account_type,
      account_number: card.account_number,
      agency: card.agency,
      holder_name: card.holder_name,
      balance: card.balance,
      limit: card.limit,
      is_active: card.is_active,
      notes: card.notes || ""
    });
    setIsCardModalOpen(true);
  };

  const handleViewCard = (card: Account) => {
    setEditingCard(card);
    setIsViewMode(true);
    
    // Garantir que bank_id seja string para compatibilidade com o Select
    const bankId = String(card.bank_id);
    
    setAccountFormData({
      bank_id: bankId,
      account_type: card.account_type,
      account_number: card.account_number,
      agency: card.agency,
      holder_name: card.holder_name,
      balance: card.balance,
      limit: card.limit,
      is_active: card.is_active,
      notes: card.notes || ""
    });
    setIsCardModalOpen(true);
  };

  const handleDeleteCard = (card: Account) => {
    setItemToDelete(card);
    setIsDeleteAccountModalOpen(true);
  };

  const getFilteredCards = () => {
    return accounts.filter(account => 
      (account.account_type === 'credit' || account.account_type === 'debit') &&
      applyFilters([account]).length > 0
    );
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsViewMode(false);
    
    // Garantir que bank_id seja string para compatibilidade com o Select
    const bankId = String(account.bank_id);
    
    setAccountFormData({
      bank_id: bankId,
      account_type: account.account_type,
      account_number: account.account_number,
      agency: account.agency,
      holder_name: account.holder_name,
      balance: account.balance,
      limit: account.limit,
      is_active: account.is_active,
      notes: account.notes || ""
    });
    setIsAccountModalOpen(true);
  };

  const handleViewAccount = (account: Account) => {
    setEditingAccount(account);
    setIsViewMode(true);
    
    // Garantir que bank_id seja string para compatibilidade com o Select
    const bankId = String(account.bank_id);
    
    setAccountFormData({
      bank_id: bankId,
      account_type: account.account_type,
      account_number: account.account_number,
      agency: account.agency,
      holder_name: account.holder_name,
      balance: account.balance,
      limit: account.limit,
      is_active: account.is_active,
      notes: account.notes || ""
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async () => {
    try {
      // Preparar dados para envio
      const dataToSend = { ...accountFormData };
      

      
      // Se for cartão de crédito ou débito, definir agência como "N/A" se estiver vazia
      if ((dataToSend.account_type === 'credit' || dataToSend.account_type === 'debit') && !dataToSend.agency) {
        dataToSend.agency = 'N/A';
      }
      
      // Verificar se está editando conta ou cartão
      if (editingAccount) {
        await api.put(`/api/v1/accounts/${editingAccount.id}`, dataToSend);
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso"
        });
        setIsAccountModalOpen(false);
      } else if (editingCard) {
        await api.put(`/api/v1/accounts/${editingCard.id}`, dataToSend);
        toast({
          title: "Sucesso",
          description: "Cartão atualizado com sucesso"
        });
        setIsCardModalOpen(false);
      } else {
        await api.post("/api/v1/accounts/", dataToSend);
        toast({
          title: "Sucesso",
          description: "Cartão criado com sucesso"
        });
        setIsCardModalOpen(false);
      }
      await loadAccounts();
      loadSummary();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = (account: Account) => {
    setItemToDelete(account);
    setIsDeleteAccountModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/api/v1/accounts/${itemToDelete.id}`);
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso"
      });
      setIsDeleteAccountModalOpen(false);
      setItemToDelete(null);
      await loadAccounts();
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive"
      });
    }
  };

  // Funções auxiliares
  const getAccountTypeLabel = (type: string) => {
    const types = {
      checking: "Conta Corrente",
      savings: "Conta Poupança",
      investment: "Conta Investimento",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito"
    };
    return types[type as keyof typeof types] || type;
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Banknote className="h-4 w-4" />;
      case 'savings':
        return <TrendingUp className="h-4 w-4" />;
      case 'investment':
        return <BarChart3 className="h-4 w-4" />;
      case 'credit':
        return <CreditCard className="h-4 w-4" />;
      case 'debit':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  // Filtros
  const applyFilters = (data: any[]) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.filter(item => {
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.name?.toLowerCase().includes(searchLower) ||
          item.code?.toLowerCase().includes(searchLower) ||
          item.account_number?.toLowerCase().includes(searchLower) ||
          item.holder_name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro por banco (apenas para contas)
      if (filterBank !== "all" && 'bank_id' in item && item.bank_id !== filterBank) {
        return false;
      }

      // Filtro por tipo (apenas para contas)
      if (filterType !== "all" && 'account_type' in item && item.account_type !== filterType) {
        return false;
      }

      // Filtro por status
      if (filterStatus !== "all") {
        const isActive = filterStatus === "active";
        if (item.is_active !== isActive) {
          return false;
        }
      }

      return true;
    });
  };

  const getFilteredBanks = () => applyFilters(banks);
  const getFilteredAccounts = () => {
    // Filtrar apenas contas bancárias (não cartões)
    const bankAccounts = accounts.filter(acc => 
      acc.account_type === 'checking' || 
      acc.account_type === 'savings' || 
      acc.account_type === 'investment'
    );
    return applyFilters(bankAccounts);
  };

  const getSummaryValue = (key: keyof AccountSummary, defaultValue: number = 0) => {
    return summary ? summary[key] : defaultValue;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-600">Gerencie bancos e contas correntes</p>
        </div>
      </div>

      {/* Cards de Resumo - Contas Bancárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSummaryValue('bank_accounts')}</div>
            <p className="text-xs text-muted-foreground">
              {getSummaryValue('bank_active')} ativas, {getSummaryValue('bank_inactive')} inativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bancário</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getSummaryValue('bank_balance'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo em contas bancárias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Bancário</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getSummaryValue('bank_limit'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Limite de contas bancárias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo - Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartões</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSummaryValue('card_accounts')}</div>
            <p className="text-xs text-muted-foreground">
              {getSummaryValue('card_active')} ativos, {getSummaryValue('card_inactive')} inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatura/Saldo Cartões</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getSummaryValue('card_balance'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Fatura + saldo em cartões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Cartões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getSummaryValue('card_limit'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Limite total dos cartões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Total Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-blue-900">Resumo Geral</CardTitle>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {getSummaryValue('total_accounts')} contas
                </div>
                <p className="text-sm text-blue-700">
                  {getSummaryValue('active_accounts')} ativas, {getSummaryValue('inactive_accounts')} inativas
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(getSummaryValue('total_balance'))}
                </div>
                <p className="text-sm text-blue-700">
                  Saldo total disponível
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(getSummaryValue('total_available'))}
                </div>
                <p className="text-sm text-blue-700">
                  Saldo + limite total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banks">Bancos</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="cards">Cartões</TabsTrigger>
        </TabsList>

        {/* Tab Bancos */}
        <TabsContent value="banks" className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateBank}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banco
            </Button>
          </div>

          {/* Tabela de Bancos */}
          <Card>
            <CardHeader>
              <CardTitle>Bancos</CardTitle>
              <CardDescription>
                {getFilteredBanks().length} banco(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredBanks().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhum banco encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredBanks().map((bank) => (
                      <TableRow key={bank.id}>
                        <TableCell className="font-medium">{bank.name}</TableCell>
                        <TableCell>{bank.code}</TableCell>
                        <TableCell>{bank.website || '-'}</TableCell>
                        <TableCell>{bank.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(bank.is_active)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBank(bank)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBank(bank)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBank(bank)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contas */}
        <TabsContent value="accounts" className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por conta, titular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterBank} onValueChange={setFilterBank}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Conta Poupança</SelectItem>
                <SelectItem value="investment">Conta Investimento</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          {/* Tabela de Contas */}
          <Card>
            <CardHeader>
              <CardTitle>Contas</CardTitle>
              <CardDescription>
                {getFilteredAccounts().length} conta(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conta/Agência</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAccounts().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhuma conta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredAccounts().map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.bank_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getAccountTypeIcon(account.account_type)}
                            <span>{getAccountTypeLabel(account.account_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.account_number} / {account.agency}
                        </TableCell>
                        <TableCell>{account.holder_name}</TableCell>
                        <TableCell>
                          <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(account.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(account.limit)}
                        </TableCell>
                        <TableCell>{getStatusBadge(account.is_active)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAccount(account)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Cartões */}
        <TabsContent value="cards" className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cartão, titular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterBank} onValueChange={setFilterBank}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="debit">Cartão de Débito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateCard}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartão
            </Button>
          </div>

          {/* Tabela de Cartões */}
          <Card>
            <CardHeader>
              <CardTitle>Cartões</CardTitle>
              <CardDescription>
                {getFilteredCards().length} cartão(ões) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número do Cartão</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Limite/Fatura</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredCards().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Nenhum cartão encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredCards().map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-medium">{card.bank_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getAccountTypeIcon(card.account_type)}
                            <span>{getAccountTypeLabel(card.account_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {card.account_type === 'credit' ? 
                            `**** **** **** ${card.account_number.slice(-4)}` : 
                            card.account_number
                          }
                        </TableCell>
                        <TableCell>{card.holder_name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Limite:</span> {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(card.limit)}
                            </div>
                            {card.account_type === 'credit' && (
                              <div className="text-sm">
                                <span className="font-medium">Fatura:</span> {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(card.balance)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(card.is_active)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCard(card)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCard(card)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCard(card)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Banco */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? (isViewMode ? 'Visualizar Banco' : 'Editar Banco') : 'Novo Banco'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Detalhes do banco' : 'Preencha os dados do banco'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Banco *</Label>
              <Input
                id="name"
                value={bankFormData.name}
                onChange={(e) => setBankFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div>
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={bankFormData.code}
                onChange={(e) => setBankFormData(prev => ({ ...prev, code: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={bankFormData.website}
                onChange={(e) => setBankFormData(prev => ({ ...prev, website: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={bankFormData.phone}
                onChange={(e) => setBankFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={bankFormData.is_active}
                onChange={(e) => setBankFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                disabled={isViewMode}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
            {!isViewMode && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsBankModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveBank}>
                  {editingBank ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Conta */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? (isViewMode ? 'Visualizar Conta' : 'Editar Conta') : 'Nova Conta'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Detalhes da conta' : 'Preencha os dados da conta'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_id">Banco *</Label>
              <Select
                value={accountFormData.bank_id}
                onValueChange={(value) => setAccountFormData(prev => ({ ...prev, bank_id: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account_type">Tipo de Conta *</Label>
              <Select
                value={accountFormData.account_type}
                onValueChange={handleAccountTypeChange}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Conta Poupança</SelectItem>
                  <SelectItem value="investment">Conta Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Campos específicos para contas bancárias (não cartões) */}
            {accountFormData.account_type !== 'credit' && accountFormData.account_type !== 'debit' && (
              <>
                <div>
                  <Label htmlFor="account_number">Número da Conta *</Label>
                  <Input
                    id="account_number"
                    value={accountFormData.account_number}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Ex: 12345-6"
                  />
                </div>
                <div>
                  <Label htmlFor="agency">Agência *</Label>
                  <Input
                    id="agency"
                    value={accountFormData.agency}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, agency: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Ex: 0001"
                  />
                </div>
                <div>
                  <Label htmlFor="holder_name">Titular *</Label>
                  <Input
                    id="holder_name"
                    value={accountFormData.holder_name}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, holder_name: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Nome do titular da conta"
                  />
                </div>
              </>
            )}

            {/* Campos específicos para cartões */}
            {(accountFormData.account_type === 'credit' || accountFormData.account_type === 'debit') && (
              <>
                <div>
                  <Label htmlFor="account_number">Número do Cartão *</Label>
                  <Input
                    id="account_number"
                    value={accountFormData.account_number}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Ex: 1234 5678 9012 3456"
                  />
                </div>
                <div>
                  <Label htmlFor="holder_name">Titular do Cartão *</Label>
                  <Input
                    id="holder_name"
                    value={accountFormData.holder_name}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, holder_name: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="Nome como está no cartão"
                  />
                </div>
              </>
            )}

            {/* Campos financeiros - sempre visíveis */}
            <div>
              <Label htmlFor="balance">
                {accountFormData.account_type === 'credit' ? 'Saldo Atual (Fatura)' : 
                 accountFormData.account_type === 'debit' ? 'Saldo Atual' : 'Saldo Atual'}
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={accountFormData.balance}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                disabled={isViewMode}
                placeholder={accountFormData.account_type === 'credit' ? 'Valor da fatura atual' : 
                           accountFormData.account_type === 'debit' ? 'Saldo disponível' : 'Saldo disponível'}
              />
            </div>
            <div>
              <Label htmlFor="limit">
                {accountFormData.account_type === 'credit' ? 'Limite Total' : 
                 accountFormData.account_type === 'debit' ? 'Limite Diário' : 'Limite de Crédito'}
              </Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                value={accountFormData.limit}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                disabled={isViewMode}
                placeholder={accountFormData.account_type === 'credit' ? 'Limite total do cartão' : 
                           accountFormData.account_type === 'debit' ? 'Limite diário de saque' : 'Limite disponível'}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={accountFormData.notes}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={accountFormData.is_active}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                disabled={isViewMode}
              />
              <Label htmlFor="is_active">Ativa</Label>
            </div>
            {!isViewMode && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAccountModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAccount}>
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cartão */}
      <Dialog open={isCardModalOpen} onOpenChange={setIsCardModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? (isViewMode ? 'Visualizar Cartão' : 'Editar Cartão') : 'Novo Cartão'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Detalhes do cartão' : 'Preencha os dados do cartão'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_id">Banco *</Label>
              <Select
                value={accountFormData.bank_id}
                onValueChange={(value) => setAccountFormData(prev => ({ ...prev, bank_id: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account_type">Tipo de Cartão *</Label>
              <Select
                value={accountFormData.account_type}
                onValueChange={handleAccountTypeChange}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account_number">Número do Cartão *</Label>
              <Input
                id="account_number"
                value={accountFormData.account_number}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, account_number: e.target.value }))}
                disabled={isViewMode}
                placeholder="Ex: 1234 5678 9012 3456"
              />
            </div>
            <div>
              <Label htmlFor="holder_name">Titular do Cartão *</Label>
              <Input
                id="holder_name"
                value={accountFormData.holder_name}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, holder_name: e.target.value }))}
                disabled={isViewMode}
                placeholder="Nome como está no cartão"
              />
            </div>
            <div>
              <Label htmlFor="balance">
                {accountFormData.account_type === 'credit' ? 'Fatura Atual' : 'Saldo Atual'}
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={accountFormData.balance}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                disabled={isViewMode}
                placeholder={accountFormData.account_type === 'credit' ? 'Valor da fatura atual' : 'Saldo disponível'}
              />
            </div>
            <div>
              <Label htmlFor="limit">
                {accountFormData.account_type === 'credit' ? 'Limite Total' : 'Limite Diário'}
              </Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                value={accountFormData.limit}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                disabled={isViewMode}
                placeholder={accountFormData.account_type === 'credit' ? 'Limite total do cartão' : 'Limite diário de saque'}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={accountFormData.notes}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={accountFormData.is_active}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                disabled={isViewMode}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
            {!isViewMode && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCardModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAccount}>
                  {editingCard ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Banco */}
      <Dialog open={isDeleteBankModalOpen} onOpenChange={setIsDeleteBankModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o banco "{itemToDelete && 'name' in itemToDelete ? itemToDelete.name : ''}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteBankModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBank}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Conta */}
      <Dialog open={isDeleteAccountModalOpen} onOpenChange={setIsDeleteAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta "{itemToDelete && 'account_number' in itemToDelete ? itemToDelete.account_number : ''}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteAccountModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 