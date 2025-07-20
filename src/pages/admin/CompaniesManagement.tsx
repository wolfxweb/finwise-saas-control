import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Building2, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Users,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign
} from 'lucide-react';
import { adminAPI } from '@/services/api';

interface Company {
  id: string;
  name: string;
  corporate_name: string;
  cnpj: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: string;
  plan_type: string;
  created_at: string;
  user_count: number;
  revenue?: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

const CompaniesManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInactivatingUsers, setIsInactivatingUsers] = useState(false);
  const [isReactivatingUsers, setIsReactivatingUsers] = useState(false);
  const [inactivatingCompanyId, setInactivatingCompanyId] = useState<string | null>(null);
  const [reactivatingCompanyId, setReactivatingCompanyId] = useState<string | null>(null);
  
  // Estados para modal de faturas
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedCompanyForBilling, setSelectedCompanyForBilling] = useState<Company | null>(null);
  const [companyInvoices, setCompanyInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await adminAPI.getPlans();
      setPlans(response);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Fallback para planos padrão
      setPlans([
        { id: '1', name: 'Básico', price: 99.00 },
        { id: '2', name: 'Profissional', price: 199.00 },
        { id: '3', name: 'Empresarial', price: 399.00 },
      ]);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, planFilter]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getCompanies();
      setCompanies(response);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Em caso de erro, usar dados mockados como fallback
      const mockCompanies: Company[] = [
        {
          id: '1',
          name: 'Empresa ABC Ltda',
          corporate_name: 'Empresa ABC Comércio e Serviços Ltda',
          cnpj: '12.345.678/0001-90',
          email: 'contato@empresaabc.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-567',
          status: 'active',
          plan_type: 'Profissional',
          created_at: '2024-01-15',
          user_count: 8,
          revenue: 199.00
        }
      ];
      setCompanies(mockCompanies);
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
        company.corporate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    const plan = plans.find(p => p.name === planType);
    if (!plan) return <Badge variant="outline">{planType}</Badge>;
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {planType}
        <span className="text-xs">R$ {plan.price}</span>
      </Badge>
    );
  };

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      await adminAPI.updateCompanyStatus(companyId, newStatus);
      
      // Atualizar o estado local
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, status: newStatus } : company
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      // Reverter a mudança em caso de erro
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, status: company.status } : company
      ));
    }
  };

  const handlePlanChange = async (companyId: string, newPlan: string) => {
    try {
      await adminAPI.updateCompanyPlan(companyId, newPlan);
      
      // Atualizar o estado local
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, plan_type: newPlan } : company
      ));
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      // Reverter a mudança em caso de erro
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, plan_type: company.plan_type } : company
      ));
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      setIsDeleting(true);
      await adminAPI.deleteCompany(companyToDelete.id);
      
      // Remover da lista local
      setCompanies(prev => prev.filter(company => company.id !== companyToDelete.id));
      
      // Fechar modal
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
      
      alert('Empresa excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao excluir empresa';
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const handleInactivateAllUsers = async (company: Company) => {
    try {
      setIsInactivatingUsers(true);
      setInactivatingCompanyId(company.id);
      const result = await adminAPI.inactivateAllUsers(company.id);
      
      // Atualizar a lista de empresas para refletir a mudança
      setCompanies(prev => prev.map(c => 
        c.id === company.id ? { ...c, user_count: 0 } : c
      ));
      
      alert(result.message);
    } catch (error: any) {
      console.error('Erro ao inativar usuários:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao inativar usuários';
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsInactivatingUsers(false);
      setInactivatingCompanyId(null);
    }
  };

  const handleReactivateAllUsers = async (company: Company) => {
    try {
      setIsReactivatingUsers(true);
      setReactivatingCompanyId(company.id);
      const result = await adminAPI.reactivateAllUsers(company.id);
      
      // Recarregar a lista de empresas para obter o número atualizado de usuários
      await loadCompanies();
      
      alert(result.message);
    } catch (error: any) {
      console.error('Erro ao reativar usuários:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao reativar usuários';
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsReactivatingUsers(false);
      setReactivatingCompanyId(null);
    }
  };

  const isMasterCompany = (company: Company) => {
    return company.cnpj === "00.000.000/0001-00";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const openBillingModal = async (company: Company) => {
    setSelectedCompanyForBilling(company);
    setIsBillingModalOpen(true);
    await loadCompanyInvoices(company.id);
  };

  const loadCompanyInvoices = async (companyId: string) => {
    try {
      setIsLoadingInvoices(true);
      // Buscar faturas da empresa
      const response = await adminAPI.getCompanyInvoices(companyId);
      setCompanyInvoices(response);
    } catch (error) {
      console.error('Erro ao carregar faturas da empresa:', error);
      // Dados mockados para demonstração
      setCompanyInvoices([
        {
          id: '1',
          invoice_number: '2024120001',
          total_amount: '199.00',
          status: 'paid',
          due_date: '2024-12-01',
          issue_date: '2024-11-01',
          payment_date: '2024-11-28'
        },
        {
          id: '2',
          invoice_number: '2024110001',
          total_amount: '199.00',
          status: 'overdue',
          due_date: '2024-11-01',
          issue_date: '2024-10-01',
          payment_date: null
        }
      ]);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const generateNextInvoice = async () => {
    if (!selectedCompanyForBilling) return;
    
    try {
      setIsGeneratingInvoice(true);
      await adminAPI.generateMonthlyInvoices();
      // Recarregar faturas após gerar nova
      await loadCompanyInvoices(selectedCompanyForBilling.id);
    } catch (error) {
      console.error('Erro ao gerar fatura:', error);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paga</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      case 'future':
        return <Badge className="bg-blue-100 text-blue-800">Futura</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
          <p className="text-gray-600">Gerencie todas as empresas cadastradas no sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Edite as informações da empresa' : 'Cadastre uma nova empresa no sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                corporate_name: formData.get('corporate_name') as string,
                cnpj: formData.get('cnpj') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                address: formData.get('address') as string,
                city: formData.get('city') as string,
                state: formData.get('state') as string,
                zip_code: formData.get('zip_code') as string,
              };
              
              if (isEditMode && selectedCompany) {
                try {
                  await adminAPI.updateCompany(selectedCompany.id, data);
                  alert('Empresa atualizada com sucesso!');
                  loadCompanies();
                  setIsDialogOpen(false);
                  setSelectedCompany(null);
                  setIsEditMode(false);
                } catch (error: any) {
                  console.error('Erro ao atualizar empresa:', error);
                  const errorMessage = error.response?.data?.detail || 'Erro ao atualizar empresa';
                  alert(`Erro: ${errorMessage}`);
                }
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Fantasia *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedCompany?.name || ''}
                    required
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corporate_name">Razão Social *</Label>
                  <Input
                    id="corporate_name"
                    name="corporate_name"
                    defaultValue={selectedCompany?.corporate_name || ''}
                    required
                    placeholder="Razão social completa"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    defaultValue={selectedCompany?.cnpj || ''}
                    required
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedCompany?.email || ''}
                    required
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedCompany?.phone || ''}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={selectedCompany?.address || ''}
                  placeholder="Rua, número, complemento"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={selectedCompany?.city || ''}
                    placeholder="São Paulo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={selectedCompany?.state || ''}
                    placeholder="SP"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    defaultValue={selectedCompany?.zip_code || ''}
                    placeholder="01234-567"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedCompany(null);
                    setIsEditMode(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Atualizar Empresa' : 'Criar Empresa'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, company) => sum + company.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {Math.round(companies.reduce((sum, company) => sum + company.user_count, 0) / companies.length)} por empresa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {companies.reduce((sum, company) => {
                const plan = plans.find(p => p.name === company.plan_type);
                return sum + (plan?.price || 0);
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de R$ {companies.length > 0 ? Math.round(companies.reduce((sum, company) => {
                const plan = plans.find(p => p.name === company.plan_type);
                return sum + (plan?.price || 0);
              }, 0) / companies.length) : 0} por empresa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((companies.filter(c => c.status === 'active').length / companies.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {companies.filter(c => c.status === 'active').length} de {companies.length} ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome, CNPJ, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
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

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas ({filteredCompanies.length})</CardTitle>
          <CardDescription>
            Lista de todas as empresas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Criado em</TableHead>
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
                    <TableCell>
                      <div className="font-mono text-sm">{company.cnpj}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {company.email}
                        </div>
                        {company.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {company.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={company.status} 
                        onValueChange={(value) => handleStatusChange(company.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={company.plan_type} 
                        onValueChange={(value) => handlePlanChange(company.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map(plan => (
                            <SelectItem key={plan.id} value={plan.name}>
                              {plan.name} - R$ {plan.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {company.user_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        R$ {(plans.find(p => p.name === company.plan_type)?.price || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(company.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsEditMode(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsEditMode(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBillingModal(company)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Visualizar faturas"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {!isMasterCompany(company) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInactivateAllUsers(company)}
                              disabled={isInactivatingUsers || company.user_count === 0}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Inativar todos os usuários"
                            >
                              {isInactivatingUsers && inactivatingCompanyId === company.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateAllUsers(company)}
                              disabled={isReactivatingUsers}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Reativar todos os usuários"
                            >
                              {isReactivatingUsers && reactivatingCompanyId === company.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(company)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir empresa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma empresa encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{companyToDelete?.name}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                ⚠️ Esta ação não pode ser desfeita e excluirá:
              </span>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Todos os usuários da empresa</li>
                <li>Todos os módulos ativos</li>
                <li>Todos os dados associados</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir Empresa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Faturas da Empresa */}
      <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Faturas - {selectedCompanyForBilling?.name}
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie as faturas desta empresa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companyInvoices.filter(inv => inv.status === 'paid').length}
                    </div>
                    <div className="text-sm text-gray-600">Faturas Pagas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {companyInvoices.filter(inv => inv.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">Faturas Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {companyInvoices.filter(inv => inv.status === 'overdue').length}
                    </div>
                    <div className="text-sm text-gray-600">Faturas Vencidas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão para Gerar Próxima Fatura */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Histórico de Faturas</h3>
              <Button
                onClick={generateNextInvoice}
                disabled={isGeneratingInvoice}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Próxima Fatura
                  </>
                )}
              </Button>
            </div>

            {/* Tabela de Faturas */}
            <Card>
              <CardContent className="p-0">
                {isLoadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando faturas...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell>
                            {getInvoiceStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.issue_date)}
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.due_date)}
                          </TableCell>
                          <TableCell>
                            {invoice.payment_date ? formatDate(invoice.payment_date) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={invoice.status === 'paid'}
                                onClick={() => {
                                  // Marcar como paga
                                  adminAPI.markInvoiceAsPaid(invoice.id);
                                  loadCompanyInvoices(selectedCompanyForBilling!.id);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {!isLoadingInvoices && companyInvoices.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma fatura encontrada para esta empresa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompaniesManagement; 