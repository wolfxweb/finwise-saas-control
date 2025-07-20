import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  CheckCircle, 
  Building, 
  User, 
  Mail, 
  Phone,
  MapPin,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Dados da empresa
    companyName: '',
    corporateName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Dados do usuário administrador
    firstName: '',
    lastName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    
    // Plano selecionado
    selectedPlan: '',
    
    // Termos
    acceptTerms: false,
    acceptMarketing: false
  });

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 99,
      period: '/mês',
      description: 'Ideal para pequenas empresas',
      features: [
        '3 usuários incluídos',
        '1 filial',
        'Fluxo de Caixa',
        'Gestão de Estoque',
        'Relatórios básicos',
        'Suporte por email',
        'Backup automático'
      ],
      popular: false,
      trialDays: 30
    },
    {
      id: 'professional',
      name: 'Profissional',
      price: 199,
      period: '/mês',
      description: 'Perfeito para empresas em crescimento',
      features: [
        '10 usuários incluídos',
        '3 filiais',
        'Todos os módulos básicos',
        'Contas a Pagar e Receber',
        'Centro de Custos',
        'Relatórios avançados',
        'Suporte prioritário',
        'API Access'
      ],
      popular: true,
      trialDays: 30
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 399,
      period: '/mês',
      description: 'Para grandes empresas',
      features: [
        '50 usuários incluídos',
        '10 filiais',
        'Todos os módulos',
        'Integração com ERPs',
        'Relatórios personalizados',
        'Suporte 24/7',
        'Treinamento incluso',
        'SLA Garantido'
      ],
      popular: false,
      trialDays: 30
    }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        // Validar senhas
        if (formData.password !== formData.confirmPassword) {
          alert('As senhas não coincidem!');
          return;
        }

        // Preparar dados para registro
        const registerData = {
          company: {
            name: formData.companyName,
            corporate_name: formData.corporateName,
            cnpj: formData.cnpj,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode
          },
          user: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.userEmail,
            password: formData.password
          },
          plan: formData.selectedPlan,
          trial_days: 30,
          accept_terms: formData.acceptTerms,
          accept_marketing: formData.acceptMarketing
        };

        console.log('Enviando dados para registro:', registerData);

        // Fazer registro via API
        const response = await authAPI.registerCompany(registerData);
        
        console.log('Resposta do registro:', response);

        // Fazer login automático após registro bem-sucedido
        const loginSuccess = await login(formData.userEmail, formData.password);
        
        if (loginSuccess) {
          // Mostrar mensagem de sucesso
          alert('Empresa registrada com sucesso! Você receberá um email de confirmação. Redirecionando para o dashboard...');
          
          // Redirecionar para o dashboard
          navigate('/app/dashboard');
        } else {
          alert('Empresa registrada, mas houve um problema no login automático. Faça login manualmente.');
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Erro ao registrar empresa:', error);
        
        // Mostrar erro específico se disponível
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           'Erro ao registrar empresa. Tente novamente.';
        
        alert(`Erro: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Nome da Empresa *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Ex: Minha Empresa Ltda"
              required
            />
          </div>
          <div>
            <Label htmlFor="corporateName">Razão Social *</Label>
            <Input
              id="corporateName"
              value={formData.corporateName}
              onChange={(e) => handleInputChange('corporateName', e.target.value)}
              placeholder="Ex: Minha Empresa Ltda"
              required
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email da Empresa *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contato@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua, número, complemento"
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="São Paulo"
            />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="zipCode">CEP</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Usuário Administrador</h3>
        <p className="text-gray-600 mb-4">
          Este será o usuário principal com acesso total ao sistema.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nome *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="João"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Sobrenome *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Silva"
              required
            />
          </div>
          <div>
            <Label htmlFor="userEmail">Email *</Label>
            <Input
              id="userEmail"
              type="email"
              value={formData.userEmail}
              onChange={(e) => handleInputChange('userEmail', e.target.value)}
              placeholder="joao@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Digite a senha novamente"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedPlan = plans.find(p => p.id === formData.selectedPlan);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Escolha seu Plano</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${
                  formData.selectedPlan === plan.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleInputChange('selectedPlan', plan.id)}
              >
                <CardHeader className="text-center">
                  {plan.popular && (
                    <Badge className="w-fit mx-auto mb-2">Mais Popular</Badge>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">R$ {plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedPlan && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
              <h4 className="font-semibold text-lg">Trial Gratuito de {selectedPlan.trialDays} Dias</h4>
            </div>
            <p className="text-gray-700 mb-4">
              Você terá acesso completo ao sistema por {selectedPlan.trialDays} dias sem compromisso. 
              Após este período, será necessário configurar o pagamento para continuar usando.
            </p>
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Resumo do Plano</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plano {selectedPlan.name}:</span>
                  <span>R$ {selectedPlan.price}/mês</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Trial de {selectedPlan.trialDays} dias:</span>
                  <span>Grátis</span>
                </div>
                <div className="border-t pt-2 font-semibold">
                  <div className="flex justify-between">
                    <span>Total após trial:</span>
                    <span>R$ {selectedPlan.price}/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
            />
            <Label htmlFor="acceptTerms" className="text-sm">
              Li e aceito os <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a> e{' '}
              <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acceptMarketing"
              checked={formData.acceptMarketing}
              onCheckedChange={(checked) => handleInputChange('acceptMarketing', checked as boolean)}
            />
            <Label htmlFor="acceptMarketing" className="text-sm">
              Aceito receber comunicações sobre novos recursos e atualizações
            </Label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {step === 1 && 'Dados da Empresa'}
              {step === 2 && 'Usuário Administrador'}
              {step === 3 && 'Escolha do Plano'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastro de Empresa</CardTitle>
            <CardDescription>
              {step === 1 && 'Informe os dados da sua empresa'}
              {step === 2 && 'Configure o usuário administrador'}
              {step === 3 && 'Escolha seu plano e comece o trial'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div className="flex justify-between pt-6">
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(step - 1)}
                  >
                    Voltar
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="ml-auto"
                  disabled={step === 3 && (!formData.acceptTerms || !formData.selectedPlan) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    step < 3 ? 'Próximo' : 'Criar Conta e Iniciar Trial'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold">Trial de 30 Dias</h4>
            <p className="text-sm text-gray-600">Acesso completo sem compromisso</p>
          </div>
          <div className="text-center p-4">
            <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold">Setup Instantâneo</h4>
            <p className="text-sm text-gray-600">Comece a usar em 5 minutos</p>
          </div>
          <div className="text-center p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold">Suporte 24/7</h4>
            <p className="text-sm text-gray-600">Equipe sempre disponível</p>
          </div>
          <div className="text-center p-4">
            <Building className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold">Planos Flexíveis</h4>
            <p className="text-sm text-gray-600">Escolha o que melhor se adapta</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 