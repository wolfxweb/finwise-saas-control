import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Building, 
  Shield, 
  Zap,
  Star,
  ArrowRight,
  Play,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Store,
  Receipt,
  UserCheck,
  Headphones,
  Loader2
} from 'lucide-react';
import { adminAPI } from '@/services/api';

const Home = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await adminAPI.getPublicPlans();
      setPlans(response);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Em caso de erro, usar dados mockados como fallback
      setPlans([
        {
          name: "Básico",
          price: 99,
          billing_cycle: "monthly",
          description: "Ideal para pequenas empresas",
          max_users: 3,
          max_branches: 1,
          modules: []
        },
        {
          name: "Profissional",
          price: 199,
          billing_cycle: "monthly",
          description: "Perfeito para empresas em crescimento",
          max_users: 10,
          max_branches: 3,
          modules: []
        },
        {
          name: "Empresarial",
          price: 399,
          billing_cycle: "monthly",
          description: "Para grandes empresas",
          max_users: 50,
          max_branches: 10,
          modules: []
        }
      ]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Fluxo de Caixa",
      description: "Controle total do fluxo de caixa com relatórios em tempo real",
      price: "R$ 79/mês"
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Contas a Receber",
      description: "Gestão completa de recebimentos e cobranças",
      price: "R$ 59/mês"
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Gestão de Estoque",
      description: "Controle de produtos e movimentações de estoque",
      price: "R$ 49/mês"
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Compras",
      description: "Gestão de fornecedores e pedidos de compra",
      price: "R$ 39/mês"
    },
    {
      icon: <Store className="h-6 w-6" />,
      title: "Vendas",
      description: "Controle de pedidos e integração com marketplaces",
      price: "R$ 49/mês"
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Gestão de Usuários",
      description: "Controle de acesso e permissões por usuário",
      price: "R$ 19/mês"
    }
  ];

  const getPlanFeatures = (plan: any) => {
    const features = [
      `${plan.max_users} usuários`,
      `${plan.max_branches} filiais`,
    ];
    
    if (plan.max_invoices && plan.max_invoices > 0) {
      features.push(`${plan.max_invoices.toLocaleString()} notas fiscais/mês`);
    } else {
      features.push("Notas fiscais ilimitadas");
    }
    
    if (plan.marketplace_sync_limit && plan.marketplace_sync_limit > 0) {
      features.push(`${plan.marketplace_sync_limit.toLocaleString()} sincronizações/mês`);
    } else {
      features.push("Sincronização ilimitada");
    }
    
    if (plan.modules && plan.modules.length > 0) {
      features.push(`${plan.modules.length} módulos incluídos`);
    } else {
      features.push("Módulos flexíveis");
    }
    
    features.push("Suporte por email");
    features.push("Backup automático");
    
    return features;
  };

  const testimonials = [
    {
      name: "Maria Silva",
      company: "TechCorp Ltda",
      rating: 5,
      comment: "O FinanceMax revolucionou nossa gestão financeira. Interface intuitiva e funcionalidades poderosas."
    },
    {
      name: "João Santos",
      company: "Comercial ABC",
      rating: 5,
      comment: "Excelente sistema! Conseguimos controlar múltiplas filiais com facilidade. Recomendo fortemente."
    },
    {
      name: "Ana Costa",
      company: "Distribuidora XYZ",
      rating: 5,
      comment: "O melhor investimento que fizemos. ROI impressionante e suporte excepcional."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FinanceMax</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Funcionalidades
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                Preços
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Contato
              </Button>
              <Button asChild>
                <a href="/login">Entrar</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 Sistema SaaS Multiempresa
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestão Empresarial
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Simplificada
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema completo para empresas com múltiplas filiais. Controle financeiro, estoque, 
            vendas e muito mais em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <a href="/register">Começar Agora - Grátis por 14 dias</a>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setIsVideoOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              Ver Demo
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Sem instalação
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Setup em 5 minutos
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Suporte 24/7
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Módulos Flexíveis para Sua Empresa
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha apenas os módulos que sua empresa precisa. Pague apenas pelo que usar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {feature.icon}
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {feature.price}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos que Crescem com Sua Empresa
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comece pequeno e escale conforme sua empresa cresce. Sem contratos longos.
            </p>
          </div>
          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando planos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={plan.id || index} className={`relative ${index === 1 ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}>
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Mais Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-gray-500 ml-1">/mês</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {getPlanFeatures(plan).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${index === 1 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={index === 1 ? 'default' : 'outline'}
                    >
                      <a href="/register">Começar Agora</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que Nossos Clientes Dizem
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para Transformar Sua Empresa?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já confiam no FinanceMax para suas operações.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <a href="/register">Começar Teste Grátis</a>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <a href="/contact">Falar com Vendas</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Entre em Contato
              </h2>
              <p className="text-gray-600 mb-8">
                Nossa equipe está pronta para ajudar você a escolher o melhor plano 
                para sua empresa.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-600 mr-3" />
                  <span>contato@financemax.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-600 mr-3" />
                  <span>(11) 99999-9999</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                  <span>São Paulo, SP - Brasil</span>
                </div>
              </div>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Solicitar Demonstração</CardTitle>
                  <CardDescription>
                    Preencha o formulário e nossa equipe entrará em contato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nome"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Sobrenome"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Empresa"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Mensagem"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button type="submit" className="w-full">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">FinanceMax</span>
              </div>
              <p className="text-gray-400">
                Sistema de gestão empresarial para empresas com múltiplas filiais.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Integrações</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Imprensa</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Administração</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/admin/login" className="hover:text-white">Painel Master</a></li>
                <li><a href="#" className="hover:text-white">Gestão de Empresas</a></li>
                <li><a href="#" className="hover:text-white">Relatórios</a></li>
                <li><a href="#" className="hover:text-white">Configurações</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FinanceMax. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 