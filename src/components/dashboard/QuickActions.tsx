import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, FileText, TrendingUp, Calculator, Users } from "lucide-react";

const actions = [
  {
    title: "Nova Entrada",
    description: "Registrar recebimento",
    icon: TrendingUp,
    variant: "success" as const,
  },
  {
    title: "Nova Saída",
    description: "Registrar pagamento",
    icon: CreditCard,
    variant: "destructive" as const,
  },
  {
    title: "Novo Cliente",
    description: "Cadastrar cliente",
    icon: Users,
    variant: "outline" as const,
  },
  {
    title: "Gerar Relatório",
    description: "Relatório financeiro",
    icon: FileText,
    variant: "outline" as const,
  },
  {
    title: "Planejamento",
    description: "Orçamento mensal",
    icon: Calculator,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="w-full justify-start h-auto p-4"
            >
              <action.icon className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}