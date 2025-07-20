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
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Star,
  Zap,
  Settings,
  BarChart3
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
  is_featured?: boolean;
  active_subscriptions: number;
  total_revenue: number;
  created_at: string;
  features: string[];
  dependencies?: string[];
}

const ModulesManagement = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      // Dados mockados para demonstração
      const mockModules: Module[] = [
        {
          id: '1',
          name: 'Fluxo de Caixa',
          code: 'cash_flow',
          description: 'Controle completo de fluxo de caixa e movimentações financeiras',
          price: 79.00,
          category: 'finance',
          is_active: true,
          is_featured: true,
          active_subscriptions: 12,
          total_revenue: 948.00,
          created_at: '2024-01-01',
          features: [
            'Controle de receitas e despesas',
            'Projeções financeiras',
            'Relatórios detalhados',
            'Integração bancária',
            'Dashboard em tempo real'
          ]
        },
        {
          id: '2',
          name: 'Gestão de Estoque',
          code: 'inventory',
          description: 'Sistema completo de controle de estoque e movimentações',
          price: 49.00,
          category: 'inventory',
          is_active: true,
          active_subscriptions: 18,
          total_revenue: 882.00,
          created_at: '2024-01-01',
          features: [
            'Controle de produtos',
            'Movimentações de estoque',
            'Alertas de estoque baixo',
            'Relatórios de inventário',
            'Códigos de barras'
          ]
        },
        {
          id: '3',
          name: 'Marketplace',
          code: 'marketplace',
          description: 'Integração com principais marketplaces do Brasil',
          price: 69.00,
          category: 'sales',
          is_active: true,
          active_subscriptions: 5,
          total_revenue: 345.00,
          created_at: '2024-01-01',
          features: [
            'Integração com Mercado Livre',
            'Integração com Amazon',
            'Sincronização de produtos',
            'Gestão de pedidos',
            'Relatórios de vendas'
          ],
          dependencies: ['inventory']
        },
        {
          id: '4',
          name: 'Contas a Pagar',
          code: 'accounts_payable',
          description: 'Gestão completa de contas a pagar',
          price: 59.00,
          category: 'finance',
          is_active: true,
          active_subscriptions: 8,
          total_revenue: 472.00,
          created_at: '2024-01-01',
          features: [
            'Controle de fornecedores',
            'Gestão de faturas',
            'Agendamento de pagamentos',
            'Relatórios de contas',
            'Integração bancária'
          ]
        },
        {
          id: '5',
          name: 'Contas a Receber',
          code: 'accounts_receivable',
          description: 'Gestão completa de contas a receber',
          price: 59.00,
          category: 'finance',
          is_active: true,
          active_subscriptions: 10,
          total_revenue: 590.00,
          created_at: '2024-01-01',
          features: [
            'Controle de clientes',
            'Gestão de faturas',
            'Cobrança automática',
            'Relatórios de recebimento',
            'Integração bancária'
          ]
        },
        {
          id: '6',
          name: 'Centro de Custos',
          code: 'cost_center',
          description: 'Análise detalhada de custos por centro de custo',
          price: 89.00,
          category: 'finance',
          is_active: true,
          active_subscriptions: 3,
          total_revenue: 267.00,
          created_at: '2024-01-01',
          features: [
            'Definição de centros de custo',
            'Alocação de despesas',
            'Relatórios analíticos',
            'Dashboard de custos',
            'Projeções financeiras'
          ]
        }
      ];

      setModules(mockModules);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (moduleId: string) => {
    try {
      setModules(prev => prev.map(module =>
        module.id === moduleId ? { ...module, is_active: !module.is_active } : module
      ));
    } catch (error) {
      console.error('Erro ao alterar status do módulo:', error);
    }
  };

  const handleToggleFeatured = async (moduleId: string) => {
    try {
      setModules(prev => prev.map(module =>
        module.id === moduleId ? { ...module, is_featured: !module.is_featured } : module
      ));
    } catch (error) {
      console.error('Erro ao alterar destaque do módulo:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finance':
        return <DollarSign className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'sales':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'finance':
        return 'Financeiro';
      case 'inventory':
        return 'Estoque';
      case 'sales':
        return 'Vendas';
      default:
        return category;
    }
  };

  const filteredModules = categoryFilter === 'all' 
    ? modules 
    : modules.filter(module => module.category === categoryFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Módulos</h1>
          <p className="text-gray-600">Gerencie os módulos disponíveis no sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Módulo' : 'Novo Módulo'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Edite as informações do módulo' : 'Crie um novo módulo para o sistema'}
              </DialogDescription>
            </DialogHeader>
            {/* TODO: Implementar formulário de módulo */}
            <div className="space-y-4">
              <p className="text-gray-500">Formulário de módulo será implementado aqui...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Módulos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">
              {modules.filter(m => m.is_active).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.reduce((sum, module) => sum + module.active_subscriptions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {Math.round(modules.reduce((sum, module) => sum + module.active_subscriptions, 0) / modules.length)} por módulo
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
              {formatCurrency(modules.reduce((sum, module) => sum + module.total_revenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Média de {formatCurrency(modules.reduce((sum, module) => sum + module.total_revenue, 0) / modules.length)} por módulo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulo Mais Popular</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.reduce((max, module) => 
                module.active_subscriptions > max.active_subscriptions ? module : max
              ).name}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.max(...modules.map(m => m.active_subscriptions))} assinaturas
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
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="inventory">Estoque</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setCategoryFilter('all')}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <Card key={module.id} className={`relative ${module.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
            {module.is_featured && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Destaque
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(module.category)}
                  <Badge variant="outline">{getCategoryName(module.category)}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(module.price)}</div>
                  <div className="text-sm text-gray-500">/mês</div>
                </div>
              </div>
              <CardTitle className="text-xl">{module.name}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Funcionalidades:</h4>
                <ul className="space-y-1">
                  {module.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                  {module.features.length > 3 && (
                    <li className="text-sm text-gray-500">
                      +{module.features.length - 3} mais funcionalidades
                    </li>
                  )}
                </ul>
              </div>

              {/* Dependencies */}
              {module.dependencies && module.dependencies.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="font-medium text-sm mb-2">Dependências:</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.dependencies.map((dep, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{module.active_subscriptions}</div>
                    <div className="text-gray-500">Assinaturas</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatCurrency(module.total_revenue)}</div>
                    <div className="text-gray-500">Receita</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={module.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleActive(module.id)}
                  >
                    {module.is_active ? (
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
                    variant={module.is_featured ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFeatured(module.id)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Destaque
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedModule(module);
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
                      setSelectedModule(module);
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

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Módulos ({filteredModules.length})</CardTitle>
          <CardDescription>
            Visão detalhada de todos os módulos e suas métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinaturas</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          {module.name}
                          {module.is_featured && (
                            <Star className="h-4 w-4 text-blue-500 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{module.description}</div>
                        <div className="text-xs text-gray-400 font-mono">{module.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center w-fit">
                        {getCategoryIcon(module.category)}
                        <span className="ml-1">{getCategoryName(module.category)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(module.price)}</div>
                      <div className="text-sm text-gray-500">por mês</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={module.is_active ? "default" : "secondary"}>
                        {module.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{module.active_subscriptions}</div>
                      <div className="text-sm text-gray-500">empresas</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(module.total_revenue)}</div>
                      <div className="text-sm text-gray-500">receita mensal</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedModule(module);
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
                            setSelectedModule(module);
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

          {filteredModules.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum módulo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulesManagement; 