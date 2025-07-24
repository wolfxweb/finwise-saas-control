import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Building, Phone, Mail, MapPin, Star, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supplierAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SupplierContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  job_function?: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

interface Supplier {
  id: string;
  name: string;
  corporate_name?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  status: string;
  rating: number;
  payment_terms?: string;
  credit_limit?: number;
  current_balance?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  contacts?: SupplierContact[];
}

interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
  blocked_suppliers: number;
  average_rating: number;
}

export default function Fornecedores() {
  const { company } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('Brasil');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tecnologia');
  const [activeTab, setActiveTab] = useState<string>('info');
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isContactEditMode, setIsContactEditMode] = useState(false);
  const [selectedContact, setSelectedContact] = useState<SupplierContact | null>(null);
  const [isContactPrimary, setIsContactPrimary] = useState(false);

  useEffect(() => {
    loadSuppliers();
    loadStats();
  }, [searchTerm, statusFilter, categoryFilter]);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: 1,
        limit: 100
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;

      const response = await supplierAPI.getSuppliers(params);
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fornecedores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await supplierAPI.getSupplierStats();
      setStats(response);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateSupplier = async (formData: FormData) => {
    console.log('handleCreateSupplier chamada');
    try {
      setIsSubmitting(true);
      
      // Validar e processar credit_limit
      const creditLimitValue = formData.get('credit_limit') as string;
      const creditLimit = creditLimitValue && creditLimitValue !== '' ? parseFloat(creditLimitValue) : 0;
      
      // Função para processar campos opcionais
      const processOptionalField = (value: string) => {
        return value && value.trim() !== '' ? value : null;
      };
      
      const rawData = {
        name: formData.get('name') as string,
        corporate_name: formData.get('corporate_name') as string,
        cnpj: formData.get('cnpj') as string,
        cpf: formData.get('cpf') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cellphone: formData.get('cellphone') as string,
        website: formData.get('website') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: selectedCountry,
        category: selectedCategory,
        payment_terms: formData.get('payment_terms') as string,
        credit_limit: creditLimit,
        notes: formData.get('notes') as string,
      };
      
      // Processar campos opcionais
              const data = {
          ...rawData,
          corporate_name: processOptionalField(rawData.corporate_name),
          cnpj: processOptionalField(rawData.cnpj),
          cpf: processOptionalField(rawData.cpf),
          email: processOptionalField(rawData.email),
          phone: processOptionalField(rawData.phone),
          cellphone: processOptionalField(rawData.cellphone),
          website: processOptionalField(rawData.website),
          address: processOptionalField(rawData.address),
          city: processOptionalField(rawData.city),
          state: processOptionalField(rawData.state),
          payment_terms: processOptionalField(rawData.payment_terms),
          notes: processOptionalField(rawData.notes),
        };
      
      console.log('Dados sendo enviados:', data);
      console.log('Dados JSON:', JSON.stringify(data, null, 2));

      await supplierAPI.createSupplier(data);
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });
      setIsDialogOpen(false);
      loadSuppliers();
      loadStats();
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao criar fornecedor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSupplier = async (formData: FormData) => {
    if (!selectedSupplier) return;

    try {
      setIsSubmitting(true);
      const data = {
        name: formData.get('name') as string,
        corporate_name: formData.get('corporate_name') as string,
        cnpj: formData.get('cnpj') as string,
        cpf: formData.get('cpf') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cellphone: formData.get('cellphone') as string,
        website: formData.get('website') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: selectedCountry,
        category: selectedCategory,
        payment_terms: formData.get('payment_terms') as string,
        credit_limit: parseFloat(formData.get('credit_limit') as string) || 0,
        notes: formData.get('notes') as string,
      };

      await supplierAPI.updateSupplier(selectedSupplier.id, data);
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      setSelectedSupplier(null);
      setIsEditMode(false);
      loadSuppliers();
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao atualizar fornecedor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const handleDeleteSupplier = async (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      await supplierAPI.deleteSupplier(supplierToDelete);
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
      });
      loadSuppliers();
      loadStats();
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao excluir fornecedor",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedCountry(supplier.country || 'Brasil');
    setSelectedCategory(supplier.category || 'Tecnologia');
    setIsEditMode(true);
    setIsDialogOpen(true);
    loadContacts(supplier.id);
  };

  const openCreateDialog = () => {
    setSelectedSupplier(null);
    setSelectedCountry('Brasil');
    setSelectedCategory('Tecnologia');
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const loadContacts = async (supplierId: string) => {
    try {
      const response = await supplierAPI.getContacts(supplierId);
      setContacts(response);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      });
    }
  };

  const handleCreateContact = async (formData: FormData) => {
    if (!selectedSupplier) return;

    try {
      setIsSubmitting(true);
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cellphone: formData.get('cellphone') as string,
        job_function: formData.get('job_function') as string,
        is_primary: isContactPrimary,
      };

      await supplierAPI.createContact(selectedSupplier.id, data);
      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso!",
      });
      setIsContactDialogOpen(false);
      loadContacts(selectedSupplier.id);
    } catch (error: any) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao criar contato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContact = async (formData: FormData) => {
    if (!selectedSupplier || !selectedContact) return;

    try {
      setIsSubmitting(true);
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cellphone: formData.get('cellphone') as string,
        job_function: formData.get('job_function') as string,
        is_primary: isContactPrimary,
      };

      await supplierAPI.updateContact(selectedSupplier.id, selectedContact.id, data);
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso!",
      });
      setIsContactDialogOpen(false);
      setSelectedContact(null);
      setIsContactEditMode(false);
      loadContacts(selectedSupplier.id);
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao atualizar contato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedSupplier || !confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      await supplierAPI.deleteContact(selectedSupplier.id, contactId);
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso!",
      });
      loadContacts(selectedSupplier.id);
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao excluir contato",
        variant: "destructive",
      });
    }
  };

  const openContactEditDialog = (contact: SupplierContact) => {
    setSelectedContact(contact);
    setIsContactPrimary(contact.is_primary);
    setIsContactEditMode(true);
    setIsContactDialogOpen(true);
  };

  const openContactCreateDialog = () => {
    setSelectedContact(null);
    setIsContactPrimary(false);
    setIsContactEditMode(false);
    setIsContactDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      case "bloqueado":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gestão de fornecedores da empresa {company?.name}
          </p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground" 
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Edite as informações do fornecedor' : 'Cadastre um novo fornecedor'}
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="contacts">Contatos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <form onSubmit={async (e) => {
                  console.log('onSubmit chamado');
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  console.log('FormData criado:', formData);
                  if (isEditMode) {
                    await handleUpdateSupplier(formData);
                  } else {
                    await handleCreateSupplier(formData);
                  }
                }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Fantasia *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedSupplier?.name || ''}
                    required
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corporate_name">Razão Social</Label>
                  <Input
                    id="corporate_name"
                    name="corporate_name"
                    defaultValue={selectedSupplier?.corporate_name || ''}
                    placeholder="Razão social"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    defaultValue={selectedSupplier?.cnpj || ''}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    defaultValue={selectedSupplier?.cpf || ''}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedSupplier?.email || ''}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={selectedSupplier?.phone || ''}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cellphone">Celular</Label>
                  <Input
                    id="cellphone"
                    name="cellphone"
                    defaultValue={selectedSupplier?.cellphone || ''}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    defaultValue={selectedSupplier?.website || ''}
                    placeholder="https://www.exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={selectedSupplier?.address || ''}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={selectedSupplier?.city || ''}
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={selectedSupplier?.state || ''}
                    placeholder="SP"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select
                    name="country"
                    value={selectedCountry}
                    onValueChange={setSelectedCountry}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start">
                      <SelectItem value="Brasil">Brasil</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Paraguai">Paraguai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    name="category"
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start">
                      <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="Papelaria">Papelaria</SelectItem>
                      <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                      <SelectItem value="Serviços">Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                  <Input
                    id="payment_terms"
                    name="payment_terms"
                    defaultValue={selectedSupplier?.payment_terms || ''}
                    placeholder="30/60/90 dias"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Limite de Crédito</Label>
                  <Input
                    id="credit_limit"
                    name="credit_limit"
                    type="number"
                    step="0.01"
                    defaultValue={selectedSupplier?.credit_limit || 0}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedSupplier?.notes || ''}
                  placeholder="Observações sobre o fornecedor..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    isEditMode ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contatos do Fornecedor</h3>
              <Button onClick={openContactCreateDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Contato
              </Button>
            </div>
            
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum contato cadastrado</p>
                  <p className="text-sm text-gray-400">Adicione o primeiro contato</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{contact.name}</h4>
                            {contact.is_primary && (
                              <Badge variant="secondary">Principal</Badge>
                            )}
                          </div>
                          {contact.job_function && (
                            <p className="text-sm text-gray-600">{contact.job_function}</p>
                          )}
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="mr-1 h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="mr-1 h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.cellphone && (
                              <div className="flex items-center text-sm">
                                <Phone className="mr-1 h-3 w-3" />
                                {contact.cellphone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openContactEditDialog(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
      </div>

      {/* Cards de Resumo */}
      {!isLoadingStats && stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_suppliers}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
              <Star className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active_suppliers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_suppliers > 0 ? Math.round((stats.active_suppliers / stats.total_suppliers) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos/Bloqueados</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.inactive_suppliers + stats.blocked_suppliers}</div>
              <p className="text-xs text-muted-foreground">Fornecedores</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.average_rating}</div>
              <p className="text-xs text-muted-foreground">de 5 estrelas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Fornecedores</CardTitle>
          <CardDescription>Controle de informações e histórico de compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Papelaria">Papelaria</SelectItem>
                <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Relatório
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-center">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum fornecedor encontrado</p>
                        <p className="text-sm text-gray-400">Comece cadastrando seu primeiro fornecedor</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {supplier.cnpj || supplier.cpf || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-1 h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.city && supplier.state ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-1 h-3 w-3" />
                            {supplier.city}, {supplier.state}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{supplier.category || '-'}</TableCell>
                      <TableCell>
                        {supplier.rating > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{supplier.rating}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.credit_limit ? formatCurrency(supplier.credit_limit) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
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
        </CardContent>
      </Card>
      
      {/* Diálogo para Contatos */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isContactEditMode ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
            <DialogDescription>
              {isContactEditMode ? 'Edite as informações do contato' : 'Adicione um novo contato'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (isContactEditMode) {
              await handleUpdateContact(formData);
            } else {
              await handleCreateContact(formData);
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome *</Label>
                <Input
                  id="contact_name"
                  name="name"
                  defaultValue={selectedContact?.name || ''}
                  required
                  placeholder="Nome do contato"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_function">Função</Label>
                                  <Input
                    id="contact_function"
                    name="job_function"
                    defaultValue={selectedContact?.job_function || ''}
                    placeholder="Cargo/função"
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  name="email"
                  type="email"
                  defaultValue={selectedContact?.email || ''}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  name="phone"
                  defaultValue={selectedContact?.phone || ''}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_cellphone">Celular</Label>
              <Input
                id="contact_cellphone"
                name="cellphone"
                defaultValue={selectedContact?.cellphone || ''}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="contact_is_primary"
                checked={isContactPrimary}
                onCheckedChange={setIsContactPrimary}
              />
              <Label htmlFor="contact_is_primary">Contato principal</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isContactEditMode ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSupplier}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 