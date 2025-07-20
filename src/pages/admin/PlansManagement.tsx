import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Star,
  Package
} from 'lucide-react';
import { adminAPI } from '@/services/api';

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_branches: number;
  max_invoices?: number;
  marketplace_sync_limit?: number;
  active_companies: number;
  modules?: string[]; // Códigos dos módulos
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    loadPlans();
    loadModules();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getPlans();
      setPlans(response);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Em caso de erro, usar dados mockados como fallback
      const mockPlans: Plan[] = [
        {
          id: '1',
          name: 'Básico',
          description: 'Plano ideal para pequenas empresas que estão começando',
          price: 99.00,
          billing_cycle: 'monthly',
          max_users: 3,
          max_branches: 1,
          active_companies: 15
        }
      ];
      setPlans(mockPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const response = await adminAPI.getModules();
      setModules(response);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    }
  };

  const handleCreatePlan = async (data: {
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    max_users: number;
    max_branches: number;
    max_invoices?: number;
    marketplace_sync_limit?: number;
  }, selectedModules: string[] = []) => {
    try {
      const planData = {
        ...data,
        modules: selectedModules
      };
      const response = await adminAPI.createPlan(planData);
      if (response) {
        loadPlans();
        setIsDialogOpen(false);
        alert('Plano criado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao criar plano';
      alert(`Erro: ${errorMessage}`);
    }
  };

  const handleUpdatePlan = async (planId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    billing_cycle?: string;
    max_users?: number;
    max_branches?: number;
    max_invoices?: number;
    marketplace_sync_limit?: number;
  }, selectedModules: string[] = []) => {
    try {
      const planData = {
        ...data,
        modules: selectedModules
      };
      const response = await adminAPI.updatePlan(planId, planData);
      if (response) {
        loadPlans();
        setIsDialogOpen(false);
        alert('Plano atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar plano';
      alert(`Erro: ${errorMessage}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    
    try {
      await adminAPI.deletePlan(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      alert('Plano excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao excluir plano';
      alert(`Erro: ${errorMessage}`);
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
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Planos</h1>
          <p className="text-gray-600">Gerencie os planos disponíveis no sistema</p>
        </div>
        <Button onClick={() => {
          setSelectedPlan(null);
          setIsEditMode(false);
          setSelectedModules([]);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedPlan(null);
            setIsEditMode(false);
            setSelectedModules([]);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Plano' : 'Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Edite as informações do plano' : 'Crie um novo plano para o sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                price: parseFloat(formData.get('price') as string),
                billing_cycle: formData.get('billing_cycle') as string,
                max_users: parseInt(formData.get('max_users') as string),
                max_branches: parseInt(formData.get('max_branches') as string),
                max_invoices: formData.get('max_invoices') ? parseInt(formData.get('max_invoices') as string) : undefined,
                marketplace_sync_limit: formData.get('marketplace_sync_limit') ? parseInt(formData.get('marketplace_sync_limit') as string) : undefined,
              };
              
              // Usar módulos do estado
              const modulesToSend = [...selectedModules];
              
              if (isEditMode && selectedPlan) {
                await handleUpdatePlan(selectedPlan.id, data, modulesToSend);
              } else {
                await handleCreatePlan(data, modulesToSend);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedPlan?.name || ''}
                    required
                    placeholder="Ex: Básico, Profissional, Empresarial"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedPlan?.price || ''}
                    required
                    placeholder="99.90"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedPlan?.description || ''}
                  required
                  placeholder="Descreva as funcionalidades e benefícios do plano"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
                  <Select 
                    name="billing_cycle" 
                    defaultValue={selectedPlan?.billing_cycle || 'monthly'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_users">Máx. Usuários</Label>
                  <Input
                    id="max_users"
                    name="max_users"
                    type="number"
                    min="1"
                    defaultValue={selectedPlan?.max_users || ''}
                    required
                    placeholder="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_branches">Máx. Filiais</Label>
                  <Input
                    id="max_branches"
                    name="max_branches"
                    type="number"
                    min="1"
                    defaultValue={selectedPlan?.max_branches || ''}
                    required
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_invoices">Máx. Notas Fiscais</Label>
                  <Input
                    id="max_invoices"
                    name="max_invoices"
                    type="number"
                    min="0"
                    defaultValue={selectedPlan?.max_invoices || ''}
                    placeholder="1000 (0 = ilimitado)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="marketplace_sync_limit">Sincronização com Marketplace</Label>
                  <Input
                    id="marketplace_sync_limit"
                    name="marketplace_sync_limit"
                    type="number"
                    min="0"
                    defaultValue={selectedPlan?.marketplace_sync_limit || ''}
                    placeholder="1000 (0 = ilimitado)"
                  />
                </div>
              </div>
              
              {/* Seção de Módulos */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <Label className="text-base font-medium">Módulos Incluídos</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`module-${module.id}`}
                        name={`module-${module.id}`}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedModules.includes(module.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules(prev => [...prev, module.code]);
                          } else {
                            setSelectedModules(prev => prev.filter(code => code !== module.code));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`module-${module.id}`} className="font-medium cursor-pointer">
                            {module.name}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(module.price)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {module.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Selecione os módulos que estarão disponíveis neste plano
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Atualizar Plano' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              Planos disponíveis no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((sum, plan) => sum + plan.active_companies, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {Math.round(plans.reduce((sum, plan) => sum + plan.active_companies, 0) / Math.max(plans.length, 1))} por plano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(plans.reduce((sum, plan) => sum + (plan.price * plan.active_companies), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita total dos planos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Planos de Assinatura</CardTitle>
          <CardDescription>
            Gerencie os planos disponíveis no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ciclo de Cobrança</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Empresas Ativas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {plan.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(plan.price)}</div>
                      <div className="text-sm text-gray-500">/mês</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Users className="h-3 w-3 mr-1" />
                          {plan.max_users} usuários
                        </div>
                        <div className="flex items-center text-sm">
                          <Building2 className="h-3 w-3 mr-1" />
                          {plan.max_branches} filiais
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{plan.active_companies}</div>
                        <div className="text-sm text-gray-500">empresas</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsEditMode(true);
                            setSelectedModules(plan.modules || []);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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


    </div>
  );
};

export default PlansManagement; 