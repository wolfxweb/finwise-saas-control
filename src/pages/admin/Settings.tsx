import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings as SettingsIcon,
  Save,
  Globe,
  Shield,
  Mail,
  CreditCard,
  Database,
  Bell,
  Palette,
  Key,
  Loader2
} from 'lucide-react';

interface SystemSettings {
  general: {
    companyName: string;
    supportEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableAuditLog: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  billing: {
    currency: string;
    taxRate: number;
    invoicePrefix: string;
    autoRenewal: boolean;
    gracePeriod: number;
  };
  notifications: {
    newCompanyAlert: boolean;
    paymentFailureAlert: boolean;
    systemMaintenanceAlert: boolean;
    weeklyReportEmail: boolean;
    dailyBackupNotification: boolean;
  };
}

const Settings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Dados mockados para demonstração
      const mockSettings: SystemSettings = {
        general: {
          companyName: 'FinanceMax SaaS',
          supportEmail: 'suporte@financemax.com',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          maintenanceMode: false
        },
        security: {
          passwordMinLength: 8,
          requireTwoFactor: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          enableAuditLog: true
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@financemax.com',
          smtpPassword: '********',
          fromEmail: 'noreply@financemax.com',
          fromName: 'FinanceMax SaaS',
          enableEmailNotifications: true
        },
        billing: {
          currency: 'BRL',
          taxRate: 0.0,
          invoicePrefix: 'FIN',
          autoRenewal: true,
          gracePeriod: 7
        },
        notifications: {
          newCompanyAlert: true,
          paymentFailureAlert: true,
          systemMaintenanceAlert: true,
          weeklyReportEmail: true,
          dailyBackupNotification: false
        }
      };

      setSettings(mockSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Configurações salvas:', settings);
      setHasChanges(false);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Tem certeza que deseja redefinir todas as configurações?')) {
      loadSettings();
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Erro ao carregar configurações</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Geral', icon: Globe },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'billing', label: 'Cobrança', icon: CreditCard },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'advanced', label: 'Avançado', icon: SettingsIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie as configurações do sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Alterações não salvas
            </Badge>
          )}
          <Button variant="outline" onClick={resetSettings}>
            Redefinir
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.general.companyName}
                    onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Suporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => handleSettingChange('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('general', 'maintenanceMode', checked)}
                />
                <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configurações de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Tamanho Mínimo da Senha</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout da Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Tentativas Máximas de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireTwoFactor"
                    checked={settings.security.requireTwoFactor}
                    onCheckedChange={(checked) => handleSettingChange('security', 'requireTwoFactor', checked)}
                  />
                  <Label htmlFor="requireTwoFactor">Requer Autenticação de Dois Fatores</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAuditLog"
                    checked={settings.security.enableAuditLog}
                    onCheckedChange={(checked) => handleSettingChange('security', 'enableAuditLog', checked)}
                  />
                  <Label htmlFor="enableAuditLog">Ativar Log de Auditoria</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'email' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configurações do servidor SMTP e notificações por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuário SMTP</Label>
                  <Input
                    id="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Senha SMTP</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome Remetente</Label>
                  <Input
                    id="fromName"
                    value={settings.email.fromName}
                    onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableEmailNotifications"
                  checked={settings.email.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('email', 'enableEmailNotifications', checked)}
                />
                <Label htmlFor="enableEmailNotifications">Ativar Notificações por Email</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Cobrança</CardTitle>
              <CardDescription>
                Configurações relacionadas a pagamentos e cobrança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={settings.billing.currency} 
                    onValueChange={(value) => handleSettingChange('billing', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.billing.taxRate}
                    onChange={(e) => handleSettingChange('billing', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Prefixo da Fatura</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.billing.invoicePrefix}
                    onChange={(e) => handleSettingChange('billing', 'invoicePrefix', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Período de Carência (dias)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={settings.billing.gracePeriod}
                    onChange={(e) => handleSettingChange('billing', 'gracePeriod', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoRenewal"
                  checked={settings.billing.autoRenewal}
                  onCheckedChange={(checked) => handleSettingChange('billing', 'autoRenewal', checked)}
                />
                <Label htmlFor="autoRenewal">Renovação Automática</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure quais notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="newCompanyAlert"
                    checked={settings.notifications.newCompanyAlert}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'newCompanyAlert', checked)}
                  />
                  <Label htmlFor="newCompanyAlert">Alerta de Nova Empresa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paymentFailureAlert"
                    checked={settings.notifications.paymentFailureAlert}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'paymentFailureAlert', checked)}
                  />
                  <Label htmlFor="paymentFailureAlert">Alerta de Falha no Pagamento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="systemMaintenanceAlert"
                    checked={settings.notifications.systemMaintenanceAlert}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'systemMaintenanceAlert', checked)}
                  />
                  <Label htmlFor="systemMaintenanceAlert">Alerta de Manutenção do Sistema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="weeklyReportEmail"
                    checked={settings.notifications.weeklyReportEmail}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyReportEmail', checked)}
                  />
                  <Label htmlFor="weeklyReportEmail">Relatório Semanal por Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dailyBackupNotification"
                    checked={settings.notifications.dailyBackupNotification}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'dailyBackupNotification', checked)}
                  />
                  <Label htmlFor="dailyBackupNotification">Notificação de Backup Diário</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'advanced' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configurações avançadas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="databaseBackup">Backup do Banco de Dados</Label>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Executar Backup
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clearCache">Limpar Cache</Label>
                  <Button variant="outline" className="w-full">
                    <Palette className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regenerateKeys">Regenerar Chaves API</Label>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Regenerar Chaves
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemInfo">Informações do Sistema</Label>
                  <Button variant="outline" className="w-full">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Ver Informações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings; 