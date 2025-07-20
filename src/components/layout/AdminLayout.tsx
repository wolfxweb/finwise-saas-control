import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Settings,
  LogOut,
  Shield,
  BarChart3,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3,
    },
    {
      title: "Empresas",
      href: "/admin/companies",
      icon: Building2,
    },
    {
      title: "Usuários",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Planos",
      href: "/admin/plans",
      icon: CreditCard,
    },
    {
      title: "Financeiro",
      href: "/admin/billing",
      icon: DollarSign,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: TrendingUp,
    },
    {
      title: "Relatórios",
      href: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Configurações",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FinanceMax</h1>
                <p className="text-sm text-gray-500">Painel Administrativo</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">Master Administrator</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start h-12 px-4"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.title}
                </Button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 