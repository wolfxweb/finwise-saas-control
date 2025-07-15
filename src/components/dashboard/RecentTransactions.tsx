import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, ArrowDownLeft, Eye } from "lucide-react";

const transactions = [
  {
    id: 1,
    type: "entrada",
    description: "Pagamento Cliente ABC Ltda",
    amount: 15000,
    date: "2024-01-15",
    status: "confirmado",
    category: "Vendas",
  },
  {
    id: 2,
    type: "saida",
    description: "Pagamento Fornecedor XYZ",
    amount: 8500,
    date: "2024-01-15",
    status: "pendente",
    category: "Compras",
  },
  {
    id: 3,
    type: "entrada",
    description: "Recebimento Boleto - Cliente 123",
    amount: 3200,
    date: "2024-01-14",
    status: "confirmado",
    category: "Vendas",
  },
  {
    id: 4,
    type: "saida",
    description: "Folha de Pagamento",
    amount: 25000,
    date: "2024-01-14",
    status: "confirmado",
    category: "Pessoal",
  },
  {
    id: 5,
    type: "entrada",
    description: "Prestação de Serviços",
    amount: 7800,
    date: "2024-01-13",
    status: "confirmado",
    category: "Serviços",
  },
];

export function RecentTransactions() {
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transações Recentes</CardTitle>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Ver todas
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={
                    transaction.type === "entrada" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }>
                    {transaction.type === "entrada" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {transaction.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                    <Badge variant={transaction.status === "confirmado" ? "default" : "secondary"} className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === "entrada" ? "text-success" : "text-destructive"
                }`}>
                  {transaction.type === "entrada" ? "+" : "-"}R$ {transaction.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}