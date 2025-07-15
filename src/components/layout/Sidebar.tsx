import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Users
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "#", current: true },
  { name: "Fluxo de Caixa", icon: TrendingUp, href: "#" },
  { name: "Contas a Receber", icon: CreditCard, href: "#" },
  { name: "Contas a Pagar", icon: TrendingDown, href: "#" },
  { name: "Relatórios", icon: FileText, href: "#" },
  { name: "Centro de Custo", icon: PieChart, href: "#" },
  { name: "Orçamento", icon: Calculator, href: "#" },
  { name: "Clientes", icon: Users, href: "#" },
  { name: "Fornecedores", icon: Building, href: "#" },
];

export function Sidebar({ className }: SidebarProps) {
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