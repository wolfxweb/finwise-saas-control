import { useState } from "react";
import { Plus, Search, Filter, Download, Edit, Eye, Headphones, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Atendimento() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockData = [
    { 
      id: 1, 
      numero: "TKT-2024-001", 
      cliente: "João Silva", 
      assunto: "Problema com login",
      categoria: "Suporte Técnico",
      prioridade: "alta",
      status: "aberto",
      dataAbertura: "2024-01-15 10:30",
      ultimaAtualizacao: "2024-01-15 14:30"
    },
    { 
      id: 2, 
      numero: "TKT-2024-002", 
      cliente: "Maria Santos", 
      assunto: "Dúvida sobre produto",
      categoria: "Vendas",
      prioridade: "media",
      status: "em_andamento",
      dataAbertura: "2024-01-14 15:45",
      ultimaAtualizacao: "2024-01-15 09:15"
    },
    { 
      id: 3, 
      numero: "TKT-2024-003", 
      cliente: "Pedro Costa", 
      assunto: "Solicitação de reembolso",
      categoria: "Financeiro",
      prioridade: "baixa",
      status: "resolvido",
      dataAbertura: "2024-01-13 08:20",
      ultimaAtualizacao: "2024-01-14 16:30"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="secondary">Aberto</Badge>;
      case "em_andamento":
        return <Badge variant="default">Em Andamento</Badge>;
      case "resolvido":
        return <Badge variant="default">Resolvido</Badge>;
      case "fechado":
        return <Badge variant="default">Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "baixa":
        return <Badge variant="secondary">Baixa</Badge>;
      case "media":
        return <Badge variant="default">Média</Badge>;
      case "alta":
        return <Badge variant="destructive">Alta</Badge>;
      default:
        return <Badge>{prioridade}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atendimento</h1>
          <p className="text-muted-foreground">Gestão de tickets e suporte ao cliente</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+5 vs ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <MessageCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">Sendo atendidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">8</div>
            <p className="text-xs text-muted-foreground">+2 vs ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">2h 30m</div>
            <p className="text-xs text-muted-foreground">Resolução</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Tickets</CardTitle>
          <CardDescription>Acompanhamento de solicitações e suporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
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
                  <TableHead>Assunto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Abertura</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.numero}</TableCell>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.assunto}</TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell>{getPrioridadeBadge(item.prioridade)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.dataAbertura}</TableCell>
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