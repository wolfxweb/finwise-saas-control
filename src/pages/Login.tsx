import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pegar a página de onde veio o usuário
  const from = location.state?.from?.pathname || '/app';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Limpar erro quando usuário digita
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirecionar para a página que tentava acessar ou para o app
        navigate(from, { replace: true });
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'admin@financemax.com',
      password: 'admin123'
    });
    
    try {
      const success = await login('admin@financemax.com', 'admin123');
      if (success) {
        navigate('/app', { replace: true });
      }
    } catch (error) {
      setError('Erro ao fazer login com conta demo');
    }
  };

  const benefits = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: "Acesso Multiempresa",
      description: "Gerencie múltiplas filiais em uma única plataforma"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: "Módulos Flexíveis",
      description: "Escolha apenas os módulos que sua empresa precisa"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: "Suporte 24/7",
      description: "Nossa equipe está sempre disponível para ajudar"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FinanceMax</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Login Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
                <CardDescription>
                  Acesse sua conta para continuar gerenciando sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Sua senha"
                        className="pl-10 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="rememberMe" className="text-sm">
                        Lembrar de mim
                      </Label>
                    </div>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Não tem uma conta?{' '}
                      <Link 
                        to="/register" 
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Cadastre-se grátis
                      </Link>
                    </p>
                  </div>
                </form>

                {/* Demo Account */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Conta de Demonstração</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Use estas credenciais para testar o sistema:
                  </p>
                  <div className="text-xs space-y-1 mb-3">
                    <p><strong>Email:</strong> admin@financemax.com</p>
                    <p><strong>Senha:</strong> admin123</p>
                  </div>
                  <Button 
                    onClick={handleDemoLogin}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar com Demo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Sistema de Gestão Empresarial Completo
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Gerencie suas operações financeiras, estoque, vendas e muito mais 
                em uma única plataforma integrada.
              </p>
              <Badge className="mb-4" variant="secondary">
                🚀 14 dias de teste grátis
              </Badge>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  {benefit.icon}
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Empresas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">50k+</div>
                <div className="text-sm text-gray-600">Transações/Mês</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-semibold mb-2">
                Pronto para começar?
              </h3>
              <p className="text-blue-100 mb-4">
                Junte-se a centenas de empresas que já confiam no FinanceMax.
              </p>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/register">Criar Conta Grátis</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            © 2024 FinanceMax. Todos os direitos reservados. |{' '}
            <a href="#" className="hover:text-gray-700">Termos de Uso</a> |{' '}
            <a href="#" className="hover:text-gray-700">Política de Privacidade</a> |{' '}
            <a href="/admin/login" className="hover:text-gray-700">Painel Master</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 