import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2, Save, X, User, Building, MapPin, Phone, Mail } from "lucide-react";
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
  phone?: string;
  customer_type: "individual" | "company";
  status: "active" | "inactive" | "blocked";
  cpf?: string;
  cnpj?: string;
  rg?: string;
  ie?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  credit_limit: number;
  payment_terms?: string;
  discount_percentage: number;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  document?: string;
  is_active: boolean;
  credit_limit_formatted: string;
  discount_percentage_formatted: string;
  created_at: string;
  updated_at?: string;
}

interface CustomerSummary {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  blocked_customers: number;
  by_type: {
    individual: number;
    company: number;
  };
  top_cities: Array<{
    city: string;
    count: number;
  }>;
}

export default function Clientes() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Estado do modal de confirmação de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    customer_type: "individual" as "individual" | "company",
    status: "active" as "active" | "inactive" | "blocked",
    cpf: "",
    cnpj: "",
    rg: "",
    ie: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "Brasil",
    credit_limit: 0,
    payment_terms: "",
    discount_percentage: 0,
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    notes: ""
  });

  useEffect(() => {
    loadCustomers();
    loadSummary();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/v1/customers/");
      console.log("Clientes carregados:", response.data); // Debug
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get("/api/v1/customers/reports/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      customer_type: "individual",
      status: "active",
      cpf: "",
      cnpj: "",
      rg: "",
      ie: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Brasil",
      credit_limit: 0,
      payment_terms: "",
      discount_percentage: 0,
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      notes: ""
    });
    setIsViewMode(false);
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  const handleViewCustomer = async (customer: Customer) => {
    try {
      // Buscar dados completos do cliente
      const response = await api.get(`/api/v1/customers/${customer.id}`);
      const fullCustomer = response.data;
      
      setEditingCustomer(fullCustomer);
      setFormData({
        name: fullCustomer.name,
        email: fullCustomer.email,
        phone: fullCustomer.phone || "",
        customer_type: fullCustomer.customer_type,
        status: fullCustomer.status,
        cpf: fullCustomer.cpf || "",
        cnpj: fullCustomer.cnpj || "",
        rg: fullCustomer.rg || "",
        ie: fullCustomer.ie || "",
        address: fullCustomer.address || "",
        city: fullCustomer.city || "",
        state: fullCustomer.state || "",
        zip_code: fullCustomer.zip_code || "",
        country: fullCustomer.country || "Brasil",
        credit_limit: fullCustomer.credit_limit,
        payment_terms: fullCustomer.payment_terms || "",
        discount_percentage: fullCustomer.discount_percentage,
        contact_person: fullCustomer.contact_person || "",
        contact_phone: fullCustomer.contact_phone || "",
        contact_email: fullCustomer.contact_email || "",
        notes: fullCustomer.notes || ""
      });
      setIsViewMode(true);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos do cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do cliente",
        variant: "destructive"
      });
    }
  };

  const handleEditCustomer = async (customer: Customer) => {
    console.log("Editando cliente:", customer); // Debug
    
    try {
      // Buscar dados completos do cliente
      const response = await api.get(`/api/v1/customers/${customer.id}`);
      const fullCustomer = response.data;
      console.log("Dados completos do cliente:", fullCustomer); // Debug
      
      setEditingCustomer(fullCustomer);
      
      const formDataToSet = {
        name: fullCustomer.name || "",
        email: fullCustomer.email || "",
        phone: fullCustomer.phone || "",
        customer_type: fullCustomer.customer_type,
        status: fullCustomer.status,
        cpf: fullCustomer.cpf || "",
        cnpj: fullCustomer.cnpj || "",
        rg: fullCustomer.rg || "",
        ie: fullCustomer.ie || "",
        address: fullCustomer.address || "",
        city: fullCustomer.city || "",
        state: fullCustomer.state || "",
        zip_code: fullCustomer.zip_code || "",
        country: fullCustomer.country || "Brasil",
        credit_limit: fullCustomer.credit_limit || 0,
        payment_terms: fullCustomer.payment_terms || "",
        discount_percentage: fullCustomer.discount_percentage || 0,
        contact_person: fullCustomer.contact_person || "",
        contact_phone: fullCustomer.contact_phone || "",
        contact_email: fullCustomer.contact_email || "",
        notes: fullCustomer.notes || ""
      };
      
      console.log("FormData sendo definido:", formDataToSet); // Debug
      setFormData(formDataToSet);
      setIsViewMode(false);
      setActiveTab("basic");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos do cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do cliente",
        variant: "destructive"
      });
    }
  };

  const handleSaveCustomer = async () => {
    try {
      console.log("Salvando cliente com dados:", formData); // Debug
      
      if (editingCustomer) {
        console.log("Atualizando cliente ID:", editingCustomer.id); // Debug
        await api.put(`/api/v1/customers/${editingCustomer.id}`, formData);
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso"
        });
      } else {
        console.log("Criando novo cliente"); // Debug
        await api.post("/api/v1/customers/", formData);
        toast({
          title: "Sucesso",
          description: "Cliente criado com sucesso"
        });
      }
      
      // Resetar estados
      setIsModalOpen(false);
      setEditingCustomer(null);
      setIsViewMode(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        customer_type: "individual" as "individual" | "company",
        status: "active" as "active" | "inactive" | "blocked",
        cpf: "",
        cnpj: "",
        rg: "",
        ie: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "Brasil",
        credit_limit: 0,
        payment_terms: "",
        discount_percentage: 0,
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        notes: ""
      });
      
      loadCustomers();
      loadSummary();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao salvar cliente",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await api.delete(`/api/v1/customers/${customerToDelete.id}`);
      toast({
        title: "Sucesso",
        description: "Cliente deletado com sucesso"
      });
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      loadCustomers();
      loadSummary();
    } catch (error: any) {
      console.error("Erro ao deletar cliente:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao deletar cliente",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "individual" ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.cpf && customer.cpf.includes(searchTerm)) ||
                         (customer.cnpj && customer.cnpj.includes(searchTerm));
    
    const matchesType = filterType === "all" || customer.customer_type === filterType;
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e informações de contato</p>
        </div>
        <Button onClick={handleCreateCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_customers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Badge variant="default" className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_customers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pessoa Física</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.by_type.individual}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pessoa Jurídica</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.by_type.company}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email, CPF, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="type">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            {filteredCustomers.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limite de Crédito</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(customer.customer_type)}
                        <span className="capitalize">
                          {customer.customer_type === "individual" ? "Pessoa Física" : "Pessoa Jurídica"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.document || "-"}
                    </TableCell>
                    <TableCell>
                      {customer.city && customer.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.city}, {customer.state}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      {customer.credit_limit_formatted}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer)}
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
              {isViewMode ? "Visualizar Cliente" : editingCustomer ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? "Visualize as informações do cliente" : editingCustomer ? "Edite as informações do cliente" : "Cadastre um novo cliente no sistema"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => {
            console.log("Mudando para tab:", value); // Debug
            setActiveTab(value);
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básicas</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="commercial">Comercial</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do cliente"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="customer_type">Tipo de Cliente</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value: "individual" | "company") => setFormData({...formData, customer_type: value})}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Pessoa Física</SelectItem>
                      <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Pessoa de Contato</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="Nome da pessoa de contato"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefone de Contato</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact_email">Email de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contato@exemplo.com"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre o cliente"
                  rows={3}
                  disabled={isViewMode}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {formData.customer_type === "individual" ? (
                  <>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                        disabled={isViewMode}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        value={formData.rg}
                        onChange={(e) => setFormData({...formData, rg: e.target.value})}
                        placeholder="00.000.000-0"
                        disabled={isViewMode}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                        disabled={isViewMode}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ie">Inscrição Estadual</Label>
                      <Input
                        id="ie"
                        value={formData.ie}
                        onChange={(e) => setFormData({...formData, ie: e.target.value})}
                        placeholder="000.000.000"
                        disabled={isViewMode}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua, número, complemento"
                  rows={3}
                  disabled={isViewMode}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="São Paulo"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="SP"
                    maxLength={2}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                    placeholder="00000-000"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Brasil"
                  disabled={isViewMode}
                />
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit_limit">Limite de Crédito (R$)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.credit_limit / 100}
                    onChange={(e) => setFormData({...formData, credit_limit: Math.round(parseFloat(e.target.value || "0") * 100)})}
                    placeholder="0.00"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="discount_percentage">Desconto Padrão (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount_percentage / 100}
                    onChange={(e) => setFormData({...formData, discount_percentage: Math.round(parseFloat(e.target.value || "0") * 100)})}
                    placeholder="0.0"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  placeholder="Ex: 30/60/90 dias"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "blocked") => setFormData({...formData, status: value})}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            {!isViewMode && (
              <Button onClick={handleSaveCustomer}>
                <Save className="h-4 w-4 mr-2" />
                {editingCustomer ? "Atualizar" : "Criar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente "{customerToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 