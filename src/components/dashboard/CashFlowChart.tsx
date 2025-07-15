import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", entradas: 65000, saidas: 42000, saldo: 23000 },
  { name: "Fev", entradas: 78000, saidas: 45000, saldo: 33000 },
  { name: "Mar", entradas: 92000, saidas: 52000, saldo: 40000 },
  { name: "Abr", entradas: 88000, saidas: 48000, saldo: 40000 },
  { name: "Mai", entradas: 95000, saidas: 55000, saldo: 40000 },
  { name: "Jun", entradas: 105000, saidas: 58000, saldo: 47000 },
];

export function CashFlowChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Fluxo de Caixa - Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="entradas" 
              stroke="hsl(var(--success))" 
              strokeWidth={3}
              name="Entradas"
              dot={{ r: 4, fill: "hsl(var(--success))" }}
            />
            <Line 
              type="monotone" 
              dataKey="saidas" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={3}
              name="Saídas"
              dot={{ r: 4, fill: "hsl(var(--destructive))" }}
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              name="Saldo"
              dot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}