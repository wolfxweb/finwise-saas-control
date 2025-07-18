import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import CentroCustos from "./pages/financeiro/CentroCustos";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Expedicao from "./pages/Expedicao";
import Pedidos from "./pages/Pedidos";
import NotaFiscal from "./pages/NotaFiscal";
import Usuarios from "./pages/Usuarios";
import Atendimento from "./pages/Atendimento";
import Marketplace from "./pages/Marketplace";
import Fornecedores from "./pages/Fornecedores";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/centro-custos" element={<CentroCustos />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/expedicao" element={<Expedicao />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/nota-fiscal" element={<NotaFiscal />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/atendimento" element={<Atendimento />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
