import { useState } from "react";
import { Plus, Search, Filter, Download, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ContasPagar() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockData = [
    { id: 1, fornecedor: "Fornecedor ABC", valor: 2500, vencimento: "2024-01-22", status: "pendente" },
    { id: 2, fornecedor: "Empresa XYZ", valor: 1800, vencimento: "2024-01-19", status: "vencido" },
    { id: 3, fornecedor: "Distribuidora 123", valor: 3200, vencimento: "2024-01-30", status: "pago" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge variant="default">Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">Controle de despesas e pagamentos</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 18.750,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ 12.300,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ 2.450,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Vencer (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">R$ 4.000,00</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>Lista de todas as contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contas..."
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fornecedor}</TableCell>
                    <TableCell>R$ {item.valor.toLocaleString()}</TableCell>
                    <TableCell>{item.vencimento}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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