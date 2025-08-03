import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Package,
  Truck,
  ShoppingCart,
  FileText,
  Users,
  HeadphonesIcon,
  Store,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  BarChart3,
  CreditCard,
  Calculator,
  Warehouse,
  ClipboardList,
  ShoppingBag,
  Receipt,
  UserCheck,
  MessageCircle
} from "lucide-react";
import { useState } from "react";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: string;
  permission?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
  },
  {
    title: "Financeiro",
    href: "#",
    icon: DollarSign,
    children: [
      {
        title: "Fluxo de Caixa",
        href: "/app/fluxo-caixa",
        icon: BarChart3,
        module: "cash_flow",
      },
      {
        title: "Contas a Receber",
        href: "/app/contas-receber",
        icon: CreditCard,
        module: "accounts_receivable",
      },
      {
        title: "Contas a Pagar",
        href: "/app/contas-pagar",
        icon: Calculator,
        module: "accounts_payable",
      },
      {
        title: "Centro de Custos",
        href: "/app/centro-custos",
        icon: Building2,
        module: "cost_center",
      },
      {
        title: "Contas",
        href: "/app/contas",
        icon: CreditCard,
        module: "accounts",
      },
    ],
  },
  {
    title: "Produtos",
    href: "/app/produtos",
    icon: Package,
    module: "products",
  },
  {
    title: "Gestão de Estoque",
    href: "/app/estoque",
    icon: Warehouse,
    module: "inventory",
  },
  {
    title: "Fornecedores",
    href: "/app/fornecedores",
    icon: Building2,
    module: "suppliers",
  },
  {
    title: "Compras",
    href: "/app/compras",
    icon: ShoppingCart,
    module: "purchases",
  },
  {
    title: "Expedição",
    href: "/app/expedicao",
    icon: Truck,
    module: "shipping",
  },
  {
    title: "Pedidos",
    href: "/app/pedidos",
    icon: ClipboardList,
    module: "orders",
  },
  {
    title: "Marketplace",
    href: "/app/marketplace",
    icon: Store,
    module: "marketplace",
  },
  {
    title: "Nota Fiscal",
    href: "/app/nota-fiscal",
    icon: Receipt,
    module: "invoice",
  },
  {
    title: "Clientes",
    href: "/app/clientes",
    icon: Users,
    module: "CLIENTES",
  },
  {
    title: "Usuários",
    href: "/app/usuarios",
    icon: UserCheck,
    module: "users",
    permission: "users:read",
  },
  {
    title: "Atendimento",
    href: "/app/atendimento",
    icon: MessageCircle,
    module: "support",
  },
  {
    title: "Configurações",
    href: "/app/configuracoes",
    icon: Settings,
  },
  {
    title: "Meu Plano",
    href: "/app/plano",
    icon: Package,
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { user, company } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Adicionar painel admin apenas para master admin
  const allMenuItems = [
    ...menuItems,
    // Painel Admin apenas para master admin
    ...(user?.company_id === '53b3051a-5d5f-4748-a475-b4447c49aeac' ? [{
      title: "Painel Admin",
      href: "/app/admin",
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
    return location.pathname.startsWith(href);
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
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);

    if (hasChildren) {
      const accessibleChildren = item.children.filter(child =>
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
              isItemActive && "bg-accent"
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
                  key={child.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-8 px-2 text-sm",
                    isActive(child.href) && "bg-accent"
                  )}
                  onClick={() => navigate(child.href)}
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
        key={item.href}
        variant="ghost"
        className={cn(
          "w-full justify-start h-10 px-2",
          isItemActive && "bg-accent"
        )}
        onClick={() => navigate(item.href)}
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