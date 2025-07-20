import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompaniesManagement from "./pages/admin/CompaniesManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import ModulesManagement from "./pages/admin/ModulesManagement";
import BillingManagement from "./pages/admin/BillingManagement";
import CompanyPlansManagement from "./pages/admin/CompanyPlansManagement";
import Analytics from "./pages/admin/Analytics";
import UsersManagement from "./pages/admin/UsersManagement";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import AdminLayout from "./components/layout/AdminLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
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

// Layout wrapper for app routes
const AppLayout = () => (
  <ProtectedRoute>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Marketing Pages - Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="companies" element={<CompaniesManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="plans" element={<PlansManagement />} />
              <Route path="modules" element={<ModulesManagement />} />
              <Route path="company-plans" element={<CompanyPlansManagement />} />
              <Route path="billing" element={<BillingManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* App Pages - Protegidas */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<Index />} />
              <Route path="dashboard" element={<Index />} />
              

              
              {/* Módulo Financeiro */}
              <Route path="fluxo-caixa" element={
                <ProtectedRoute requiredModules={['cash_flow']}>
                  <FluxoCaixa />
                </ProtectedRoute>
              } />
              <Route path="contas-receber" element={
                <ProtectedRoute requiredModules={['accounts_receivable']}>
                  <ContasReceber />
                </ProtectedRoute>
              } />
              <Route path="contas-pagar" element={
                <ProtectedRoute requiredModules={['accounts_payable']}>
                  <ContasPagar />
                </ProtectedRoute>
              } />
              <Route path="centro-custos" element={
                <ProtectedRoute requiredModules={['cost_center']}>
                  <CentroCustos />
                </ProtectedRoute>
              } />
              
              {/* Módulo de Estoque */}
              <Route path="produtos" element={
                <ProtectedRoute requiredModules={['products']}>
                  <Produtos />
                </ProtectedRoute>
              } />
              <Route path="estoque" element={
                <ProtectedRoute requiredModules={['inventory']}>
                  <Estoque />
                </ProtectedRoute>
              } />
              
              {/* Módulo de Suprimentos */}
              <Route path="fornecedores" element={
                <ProtectedRoute requiredModules={['suppliers']}>
                  <Fornecedores />
                </ProtectedRoute>
              } />
              <Route path="compras" element={
                <ProtectedRoute requiredModules={['purchases']}>
                  <Compras />
                </ProtectedRoute>
              } />
              <Route path="expedicao" element={
                <ProtectedRoute requiredModules={['shipping']}>
                  <Expedicao />
                </ProtectedRoute>
              } />
              
              {/* Módulo de Vendas */}
              <Route path="pedidos" element={
                <ProtectedRoute requiredModules={['orders']}>
                  <Pedidos />
                </ProtectedRoute>
              } />
              <Route path="marketplace" element={
                <ProtectedRoute requiredModules={['marketplace']}>
                  <Marketplace />
                </ProtectedRoute>
              } />
              <Route path="nota-fiscal" element={
                <ProtectedRoute requiredModules={['invoice']}>
                  <NotaFiscal />
                </ProtectedRoute>
              } />
              
              {/* Módulo de Gestão */}
              <Route path="usuarios" element={
                <ProtectedRoute requiredModules={['users']} requiredPermissions={['users:read']}>
                  <Usuarios />
                </ProtectedRoute>
              } />
              <Route path="atendimento" element={
                <ProtectedRoute requiredModules={['support']}>
                  <Atendimento />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Legacy routes for backward compatibility - Protegidas */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Index /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/fluxo-caixa" element={
              <ProtectedRoute requiredModules={['cash_flow']}>
                <Layout><FluxoCaixa /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/contas-receber" element={
              <ProtectedRoute requiredModules={['accounts_receivable']}>
                <Layout><ContasReceber /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/contas-pagar" element={
              <ProtectedRoute requiredModules={['accounts_payable']}>
                <Layout><ContasPagar /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/centro-custos" element={
              <ProtectedRoute requiredModules={['cost_center']}>
                <Layout><CentroCustos /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/produtos" element={
              <ProtectedRoute requiredModules={['products']}>
                <Layout><Produtos /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute requiredModules={['inventory']}>
                <Layout><Estoque /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/compras" element={
              <ProtectedRoute requiredModules={['purchases']}>
                <Layout><Compras /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/expedicao" element={
              <ProtectedRoute requiredModules={['shipping']}>
                <Layout><Expedicao /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/pedidos" element={
              <ProtectedRoute requiredModules={['orders']}>
                <Layout><Pedidos /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/nota-fiscal" element={
              <ProtectedRoute requiredModules={['invoice']}>
                <Layout><NotaFiscal /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute requiredModules={['users']} requiredPermissions={['users:read']}>
                <Layout><Usuarios /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/atendimento" element={
              <ProtectedRoute requiredModules={['support']}>
                <Layout><Atendimento /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute requiredModules={['marketplace']}>
                <Layout><Marketplace /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/fornecedores" element={
              <ProtectedRoute requiredModules={['suppliers']}>
                <Layout><Fornecedores /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
