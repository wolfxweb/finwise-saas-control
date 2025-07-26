import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2, Save, X, Calendar, DollarSign, Users, CreditCard } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface AccountsReceivable {
  id: number;
  description: string;
  customer_id: number;
  customer_name: string;
  category_id?: number;
  category_name?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<AccountsReceivable | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    customer_id: 0,
    category_id: 0,
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
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadReceivables(),
        loadSummary(),
        loadCustomers(),
        loadCategories()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReceivables = async () => {
    try {
      const response = await api.get("/api/v1/accounts-receivable/");
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

  const handleCreateReceivable = () => {
    setEditingReceivable(null);
    setIsViewMode(false);
    setIsInstallmentMode(false);
    setActiveTab("basic");
    setFormData({
      description: "",
      customer_id: 0,
      category_id: 0,
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
      
      setEditingReceivable(fullReceivable);
      setFormData({
        description: fullReceivable.description,
        customer_id: fullReceivable.customer_id,
        category_id: fullReceivable.category_id || 0,
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
          // Preparar dados para envio, convertendo category_id 0 para null
          const updateData = { ...formData };
          if (updateData.category_id === 0) {
            updateData.category_id = null;
          }
          
          await api.put(`/api/v1/accounts-receivable/${editingReceivable.id}`, updateData);
          toast({
            title: "Sucesso",
            description: "Conta a receber atualizada com sucesso"
          });
        } else {
          // Preparar dados para envio, convertendo category_id 0 para null
          const createData = { ...formData };
          if (createData.category_id === 0) {
            createData.category_id = null;
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
    if (!confirm(`Tem certeza que deseja deletar a conta "${receivable.description}"?`)) {
      return;
    }

    api.delete(`/api/v1/accounts-receivable/${receivable.id}`)
      .then(() => {
        toast({
          title: "Sucesso",
          description: "Conta a receber deletada com sucesso"
        });
        loadData();
      })
      .catch((error: any) => {
        console.error("Erro ao deletar conta a receber:", error);
        toast({
          title: "Erro",
          description: error.response?.data?.detail || "Erro ao deletar conta a receber",
          variant: "destructive"
        });
      });
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

  const getTypeIcon = (type: string) => {
    return type === "cash" ? <DollarSign className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />;
  };

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = receivable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receivable.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receivable.reference && receivable.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || receivable.status === filterStatus;
    const matchesType = filterType === "all" || receivable.receivable_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const calculateInstallmentAmount = () => {
    if (formData.total_amount && formData.total_installments > 0) {
      return formData.total_amount / formData.total_installments;
    }
    return 0;
  };

  const calculateTotalFromInstallment = () => {
    if (formData.installment_amount && formData.total_installments > 0) {
      return formData.installment_amount * formData.total_installments;
    }
    return 0;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Controle de receitas e recebimentos</p>
        </div>
        <Button onClick={handleCreateReceivable}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

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
                R$ {summary.total_receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {summary.total_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {summary.total_overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                R$ {summary.total_pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
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
            <div className="w-full md:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">À vista</SelectItem>
                  <SelectItem value="installment">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
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
                      <div className="flex items-center gap-2">
                        {getTypeIcon(receivable.receivable_type)}
                        <span className="capitalize">
                          {receivable.receivable_type === "cash" ? "À vista" : "Parcelado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          R$ {receivable.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {receivable.paid_amount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Pago: R$ {receivable.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(receivable.due_date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(receivable.status)}
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
        </CardContent>
      </Card>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre a conta a receber"
                  rows={3}
                  disabled={isViewMode}
                />
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
    </div>
  );
}