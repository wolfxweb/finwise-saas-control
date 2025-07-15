import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  FileText,
  Settings,
  Building,
  PieChart,
  Calculator,
  Users,
  ChevronDown,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  UserCog,
  Headphones,
  ClipboardList,
  Store,
  Receipt
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/", current: true },
];

const financialNavigation = [
  { name: "Fluxo de Caixa", icon: TrendingUp, href: "/fluxo-caixa" },
  { name: "Contas a Receber", icon: CreditCard, href: "/contas-receber" },
  { name: "Contas a Pagar", icon: TrendingDown, href: "/contas-pagar" },
  { name: "Centro de Custos", icon: PieChart, href: "/centro-custos" },
];

const systemNavigation = [
  { name: "Produtos", icon: Package, href: "/produtos" },
  { name: "Gestão de Estoque", icon: Calculator, href: "/estoque" },
  { name: "Compras", icon: ShoppingCart, href: "/compras" },
  { name: "Expedição", icon: Truck, href: "/expedicao" },
  { name: "Pedidos", icon: ClipboardList, href: "/pedidos" },
  { name: "Marketplace", icon: Store, href: "/marketplace" },
  { name: "Nota Fiscal", icon: Receipt, href: "/nota-fiscal" },
  { name: "Usuários", icon: Users, href: "/usuarios" },
  { name: "Atendimento", icon: Headphones, href: "/atendimento" },
];

export function Sidebar({ className }: SidebarProps) {
  const [financialOpen, setFinancialOpen] = useState(false);
  const location = useLocation();

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center space-x-2 px-3 mb-8">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">FinanceMax</h2>
          </div>
          
          <div className="space-y-1">
            {/* Dashboard */}
            {navigation.map((item) => (
              <Button key={item.name} asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.href
                      ? "bg-gradient-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}

            {/* Financeiro Submenu */}
            <Collapsible open={financialOpen} onOpenChange={setFinancialOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Financeiro
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", financialOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-4">
                {financialNavigation.map((item) => (
                  <Button key={item.name} asChild variant="ghost" size="sm">
                    <Link
                      to={item.href}
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    >
                      <item.icon className="mr-2 h-3 w-3" />
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Outras funcionalidades */}
            {systemNavigation.map((item) => (
              <Button key={item.name} asChild variant="ghost">
                <Link
                  to={item.href}
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}