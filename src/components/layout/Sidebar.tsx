import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import {
  Home,
  DollarSign,
  CreditCard,
  Receipt,
  Package,
  ShoppingCart,
  Truck,
  Building,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Headphones,
  Store
} from "lucide-react";

// Definir tipos para os itens do menu
interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  module?: string;
  permission?: string;
  submenu?: MenuItem[];
}

// Menu principal sem o painel admin (será adicionado dinamicamente)
const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/app",
    icon: Home,
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    submenu: [
      {
        title: "Fluxo de Caixa",
        href: "/app/financeiro/fluxo-caixa",
        icon: BarChart3,
        module: "Fluxo de Caixa",
      },
      {
        title: "Contas a Receber",
        href: "/app/financeiro/contas-receber",
        icon: CreditCard,
        module: "Contas a Receber",
      },
      {
        title: "Contas a Pagar",
        href: "/app/financeiro/contas-pagar",
        icon: Receipt,
        module: "Contas a Pagar",
      },
      {
        title: "Contas",
        href: "/app/financeiro/contas",
        icon: Building,
        module: "Fluxo de Caixa",
      },
      // {
      //   title: "Centro de Custos",
      //   href: "/app/financeiro/centro-custos",
      //   icon: BarChart3,
      //   module: "Centro de Custos",
      // },
    ],
  },
  {
    title: "Produtos",
    href: "/app/produtos",
    icon: Package,
    module: "Produtos",
  },
  {
    title: "Estoque",
    href: "/app/estoque",
    icon: Package,
    module: "Gestão de Estoque",
  },
  {
    title: "Fornecedores",
    href: "/app/fornecedores",
    icon: Building,
    module: "Fornecedores",
  },
  {
    title: "Clientes",
    href: "/app/clientes",
    icon: Users,
    module: "Usuários",
  },
  {
    title: "Compras",
    href: "/app/compras",
    icon: ShoppingCart,
    module: "Compras",
  },
  {
    title: "Expedição",
    href: "/app/expedicao",
    icon: Truck,
    module: "Expedição",
  },
  {
    title: "Pedidos",
    href: "/app/pedidos",
    icon: FileText,
    module: "Pedidos",
  },
  {
    title: "Marketplace",
    href: "/app/marketplace",
    icon: Store,
    module: "Marketplace",
  },
  {
    title: "Nota Fiscal",
    href: "/app/nota-fiscal",
    icon: FileText,
    module: "Nota Fiscal",
  },
  {
    title: "Usuários",
    href: "/app/usuarios",
    icon: Users,
    module: "Usuários",
  },
  {
    title: "Atendimento",
    href: "/app/atendimento",
    icon: Headphones,
    module: "Atendimento",
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { user, company } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [masterCompanyId, setMasterCompanyId] = useState<string | null>(null);

  // Buscar ID da empresa master
  useEffect(() => {
    const fetchMasterCompanyId = async () => {
      try {
        const response = await api.get('/api/v1/admin/master-company-id');
        setMasterCompanyId(response.data.master_company_id);
      } catch (error) {
        console.error('Erro ao buscar empresa master:', error);
        setMasterCompanyId(null);
      }
    };

    if (user) {
      fetchMasterCompanyId();
    }
  }, [user]);

  // Adicionar painel admin apenas para master admin
  const allMenuItems = [
    ...menuItems,
    // Painel Admin apenas para master admin
    ...(user?.role === 'admin' && masterCompanyId && user.company_id === masterCompanyId ? [{
      title: "Painel Admin",
      href: "/admin/dashboard",
      icon: Settings,
      permission: "admin:access",
    }] : []),
  ];

  const hasModuleAccess = (module?: string) => {
    if (!module) return true;
    return company?.modules?.includes(module) || false;
  };

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) || false;
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/app") {
      return location.pathname === "/app";
    }
    // Para URLs que terminam com /, verificar se o pathname é exatamente igual
    if (href.endsWith('/')) {
      return location.pathname === href;
    }
    // Para URLs que não terminam com /, verificar se o pathname é exatamente igual
    // ou se o pathname começa com href + /
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem) => {
    // Debug: log para verificar se o menu está sendo processado
    console.log(`Processando menu: ${item.title}`, { 
      hasModuleAccess: hasModuleAccess(item.module), 
      hasPermission: hasPermission(item.permission),
      module: item.module,
      permission: item.permission
    });
    
    // Verificar se o usuário tem acesso ao módulo (exceto para "Meu Plano")
    if (item.title !== "Meu Plano" && (!hasModuleAccess(item.module) || !hasPermission(item.permission))) {
      console.log(`Menu ${item.title} foi filtrado`);
      return null;
    }

    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.submenu && item.submenu.length > 0;
    const isItemActive = isActive(item.href || ''); // Use item.href || '' for active check

    if (hasChildren) {
      const accessibleChildren = item.submenu.filter(child =>
        hasModuleAccess(child.module) && hasPermission(child.permission)
      );

      if (accessibleChildren.length === 0) {
        return null;
      }

      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between h-10 px-2",
              isItemActive && "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {accessibleChildren.map((child) => (
                <Button
                  key={child.href || child.title}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-8 px-2 text-sm",
                    isActive(child.href || '') && "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                  onClick={() => navigate(child.href || '#')}
                >
                  <child.icon className="h-4 w-4 mr-2" />
                  {child.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.href || item.title}
        variant="ghost"
        className={cn(
          "w-full justify-start h-10 px-2",
          isItemActive && "bg-blue-600 text-white hover:bg-blue-700"
        )}
        onClick={() => navigate(item.href || '#')}
      >
        <item.icon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">{item.title}</span>
      </Button>
    );
  };

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            FinanceMax
          </h2>
          <div className="space-y-1">
            {allMenuItems.map(renderMenuItem)}
          </div>
        </div>
      </div>
    </div>
  );
}