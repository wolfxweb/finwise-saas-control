import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Building2, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const MASTER_COMPANY_ID = '53b3051a-5d5f-4748-a475-b4447c49aeac';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redireciona automaticamente se já estiver autenticado como admin master
  useEffect(() => {
    console.log('AdminLogin useEffect:', { isAuthenticated, user, authLoading });
    
    if (
      isAuthenticated &&
      user &&
      user.role === 'admin' &&
      user.company_id === MASTER_COMPANY_ID
    ) {
      console.log('Redirecionando para dashboard...');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Tentando fazer login com:', email);
      const success = await login(email, password);
      console.log('Resultado do login:', success);
      
      if (!success) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
      } else {
        console.log('Login bem-sucedido, aguardando redirecionamento...');
      }
    } catch (error) {
      console.error('Erro no handleSubmit:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@financemax.com');
    setPassword('admin123');
    setIsLoading(true);
    setError('');

    try {
      const success = await login('admin@financemax.com', 'admin123');
      if (!success) {
        setError('Erro no login demo. Verifique as credenciais.');
      }
    } catch (error) {
      setError('Erro ao fazer login demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">FinanceMax</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Painel Administrativo
          </h2>
          <p className="text-gray-600">
            Gestão completa do sistema SaaS
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Acesso Master</CardTitle>
            <CardDescription>
              Entre com suas credenciais de administrador master
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@financemax.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no Painel Admin'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                Entrar com Demo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Gestão de Empresas</h3>
                <p className="text-sm text-gray-600">Gerencie todas as empresas clientes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Controle de Usuários</h3>
                <p className="text-sm text-gray-600">Monitore usuários e permissões</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Configurações do Sistema</h3>
                <p className="text-sm text-gray-600">Configure planos e módulos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Acesso restrito apenas para administradores master
          </p>
          <Button
            variant="link"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => navigate('/login')}
          >
            Voltar para login de empresas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 