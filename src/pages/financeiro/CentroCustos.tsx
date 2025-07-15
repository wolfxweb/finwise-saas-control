import { useState } from "react";
import { Plus, Search, Filter, Download, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CentroCustos() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockData = [
    { id: 1, nome: "Vendas", codigo: "CC001", orcamento: 50000, gasto: 35000, status: "ativo" },
    { id: 2, nome: "Marketing", codigo: "CC002", orcamento: 30000, gasto: 28500, status: "ativo" },
    { id: 3, nome: "Administrativo", codigo: "CC003", orcamento: 25000, gasto: 22000, status: "ativo" },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Custos</h1>
          <p className="text-muted-foreground">Controle e análise de custos por departamento</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Novo Centro de Custo
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orçado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 105.000,00</div>
            <p className="text-xs text-muted-foreground">Orçamento total aprovado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">R$ 85.500,00</div>
            <p className="text-xs text-muted-foreground">81% do orçamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ 19.500,00</div>
            <p className="text-xs text-muted-foreground">19% disponível</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Centros de Custo */}
      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo</CardTitle>
          <CardDescription>Lista de todos os centros de custo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar centros de custo..."
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Gasto</TableHead>
                  <TableHead>% Utilizado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((item) => {
                  const percentual = (item.gasto / item.orcamento) * 100;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>R$ {item.orcamento.toLocaleString()}</TableCell>
                      <TableCell>R$ {item.gasto.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(percentual, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{percentual.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}