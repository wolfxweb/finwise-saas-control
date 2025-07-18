import { useState } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Truck, Package, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Expedicao() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockData = [
    { 
      id: 1, 
      numero: "EXP-2024-001", 
      cliente: "João Silva", 
      destino: "São Paulo, SP",
      dataEnvio: "2024-01-15",
      prazoEntrega: "2024-01-18",
      status: "em_transito",
      transportadora: "Correios",
      codigoRastreio: "BR123456789BR"
    },
    { 
      id: 2, 
      numero: "EXP-2024-002", 
      cliente: "Maria Santos", 
      destino: "Rio de Janeiro, RJ",
      dataEnvio: "2024-01-14",
      prazoEntrega: "2024-01-17",
      status: "entregue",
      transportadora: "Sedex",
      codigoRastreio: "BR987654321BR"
    },
    { 
      id: 3, 
      numero: "EXP-2024-003", 
      cliente: "Pedro Costa", 
      destino: "Belo Horizonte, MG",
      dataEnvio: "2024-01-13",
      prazoEntrega: "2024-01-20",
      status: "preparando",
      transportadora: "Jadlog",
      codigoRastreio: "JD123456789"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparando":
        return <Badge variant="secondary">Preparando</Badge>;
      case "em_transito":
        return <Badge variant="default">Em Trânsito</Badge>;
      case "entregue":
        return <Badge variant="default">Entregue</Badge>;
      case "atrasado":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expedição</h1>
          <p className="text-muted-foreground">Controle de envios e logística</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nova Expedição
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envios Hoje</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+5 vs ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">45</div>
            <p className="text-xs text-muted-foreground">Aguardando entrega</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <MapPin className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">156</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Expedição */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Expedição</CardTitle>
          <CardDescription>Acompanhamento de envios e rastreamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar expedições..."
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
              Relatório
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead>Prazo Entrega</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.numero}</TableCell>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>{item.destino}</TableCell>
                    <TableCell>{new Date(item.dataEnvio).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(item.prazoEntrega).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{item.transportadora}</TableCell>
                    <TableCell className="font-mono text-sm">{item.codigoRastreio}</TableCell>
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