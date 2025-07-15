import { useState } from "react";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function FluxoCaixa() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockData = [
    { id: 1, data: "2024-01-15", descricao: "Venda de Produtos", entrada: 5000, saida: 0, saldo: 15000, tipo: "entrada" },
    { id: 2, data: "2024-01-14", descricao: "Pagamento Fornecedor", entrada: 0, saida: 2500, saldo: 10000, tipo: "saida" },
    { id: 3, data: "2024-01-13", descricao: "Recebimento Cliente", entrada: 3200, saida: 0, saldo: 12500, tipo: "entrada" },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Controle completo das movimentações financeiras</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimentação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ 45.250,00</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ 32.180,00</div>
            <p className="text-xs text-muted-foreground">-5% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 13.070,00</div>
            <p className="text-xs text-muted-foreground">Saldo em caixa</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
          <CardDescription>Histórico de todas as movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar movimentações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-success">
                      {item.entrada > 0 ? `R$ ${item.entrada.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-destructive">
                      {item.saida > 0 ? `R$ ${item.saida.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>R$ {item.saldo.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.tipo === "entrada" ? "default" : "destructive"}>
                        {item.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}