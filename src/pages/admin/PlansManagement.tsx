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
  Star
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_branches: number;
  features: string[];
  is_popular?: boolean;
  is_active: boolean;
  active_companies: number;
  total_revenue: number;
  created_at: string;
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      // Dados mockados para demonstração
      const mockPlans: Plan[] = [
        {
          id: '1',
          name: 'Básico',
          description: 'Plano ideal para pequenas empresas que estão começando',
          price: 99.00,
          billing_cycle: 'monthly',
          max_users: 3,
          max_branches: 1,
          features: [
            'Fluxo de Caixa',
            'Gestão de Estoque',
            'Relatórios Básicos',
            'Suporte por Email',
            'Backup Automático'
          ],
          is_active: true,
          active_companies: 15,
          total_revenue: 1485.00,
          created_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Plano completo para empresas em crescimento',
          price: 199.00,
          billing_cycle: 'monthly',
          max_users: 10,
          max_branches: 3,
          features: [
            'Todas as funcionalidades do Básico',
            'Contas a Pagar e Receber',
            'Centro de Custos',
            'Marketplace Integration',
            'Relatórios Avançados',
            'Suporte Prioritário',
            'API Access'
          ],
          is_popular: true,
          is_active: true,
          active_companies: 8,
          total_revenue: 1592.00,
          created_at: '2024-01-01'
        },
        {
          id: '3',
          name: 'Empresarial',
          description: 'Solução completa para grandes empresas',
          price: 399.00,
          billing_cycle: 'monthly',
          max_users: 50,
          max_branches: 10,
          features: [
            'Todas as funcionalidades do Profissional',
            'Módulos Ilimitados',
            'Integração com ERPs',
            'Relatórios Personalizados',
            'Suporte 24/7',
            'Treinamento Incluso',
            'SLA Garantido',
            'White Label'
          ],
          is_active: true,
          active_companies: 3,
          total_revenue: 1197.00,
          created_at: '2024-01-01'
        }
      ];

      setPlans(mockPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (planId: string) => {
    try {
      setPlans(prev => prev.map(plan =>
        plan.id === planId ? { ...plan, is_active: !plan.is_active } : plan
      ));
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
    }
  };

  const handleTogglePopular = async (planId: string) => {
    try {
      setPlans(prev => prev.map(plan =>
        plan.id === planId ? { ...plan, is_popular: !plan.is_popular } : plan
      ));
    } catch (error) {
      console.error('Erro ao alterar popularidade do plano:', error);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Plano' : 'Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Edite as informações do plano' : 'Crie um novo plano para o sistema'}
              </DialogDescription>
            </DialogHeader>
            {/* TODO: Implementar formulário de plano */}
            <div className="space-y-4">
              <p className="text-gray-500">Formulário de plano será implementado aqui...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">
              {plans.filter(p => p.is_active).length} ativos
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
              Média de {Math.round(plans.reduce((sum, plan) => sum + plan.active_companies, 0) / plans.length)} por plano
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
              {formatCurrency(plans.reduce((sum, plan) => sum + plan.total_revenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {formatCurrency(plans.reduce((sum, plan) => sum + plan.total_revenue, 0) / plans.length)} por plano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Mais Popular</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.find(p => p.is_popular)?.name || 'Nenhum'}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans.find(p => p.is_popular)?.active_companies || 0} empresas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_popular ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-gray-500">/mês</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium">Funcionalidades Inclusas:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{plan.max_users}</div>
                  <div className="text-xs text-gray-500">Usuários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{plan.max_branches}</div>
                  <div className="text-xs text-gray-500">Filiais</div>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Empresas Ativas:</span>
                  <span className="font-medium">{plan.active_companies}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Receita Mensal:</span>
                  <span className="font-medium">{formatCurrency(plan.total_revenue)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={plan.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleActive(plan.id)}
                  >
                    {plan.is_active ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Inativo
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant={plan.is_popular ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTogglePopular(plan.id)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Popular
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsEditMode(true);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsEditMode(false);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Planos</CardTitle>
          <CardDescription>
            Visão detalhada de todos os planos e suas métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          {plan.name}
                          {plan.is_popular && (
                            <Star className="h-4 w-4 text-blue-500 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(plan.price)}</div>
                      <div className="text-sm text-gray-500">por mês</div>
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
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{plan.active_companies}</div>
                      <div className="text-sm text-gray-500">empresas ativas</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(plan.total_revenue)}</div>
                      <div className="text-sm text-gray-500">receita mensal</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsEditMode(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsEditMode(false);
                            setIsDialogOpen(true);
                          }}
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