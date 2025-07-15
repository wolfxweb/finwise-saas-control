import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  { name: "Dashboard", icon: LayoutDashboard, href: "#", current: true },
];

const financialNavigation = [
  { name: "Fluxo de Caixa", icon: TrendingUp, href: "#" },
  { name: "Contas a Receber", icon: CreditCard, href: "#" },
  { name: "Contas a Pagar", icon: TrendingDown, href: "#" },
  { name: "Centro de Custos", icon: PieChart, href: "#" },
];

const systemNavigation = [
  { name: "Produtos", icon: Package, href: "#" },
  { name: "Gestão de Estoque", icon: Calculator, href: "#" },
  { name: "Compras", icon: ShoppingCart, href: "#" },
  { name: "Expedição", icon: Truck, href: "#" },
  { name: "Pedidos", icon: ClipboardList, href: "#" },
  { name: "Marketplace", icon: Store, href: "#" },
  { name: "Nota Fiscal", icon: Receipt, href: "#" },
  { name: "Usuários", icon: Users, href: "#" },
  { name: "Atendimento", icon: Headphones, href: "#" },
];

export function Sidebar({ className }: SidebarProps) {
  const [financialOpen, setFinancialOpen] = useState(false);

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
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  item.current
                    ? "bg-gradient-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
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
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  >
                    <item.icon className="mr-2 h-3 w-3" />
                    {item.name}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Outras funcionalidades */}
            {systemNavigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
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