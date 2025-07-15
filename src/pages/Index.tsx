import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Wallet, TrendingUp, TrendingDown, CreditCard, DollarSign, AlertCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r bg-muted/30">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
              <p className="text-muted-foreground mt-1">
                Visão geral da situação financeira da empresa
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCard
                title="Saldo Total"
                value="R$ 125.430"
                change="+12,5%"
                changeType="positive"
                icon={<Wallet className="h-4 w-4" />}
              />
              <StatsCard
                title="Receitas do Mês"
                value="R$ 94.250"
                change="+8,2%"
                changeType="positive"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatsCard
                title="Despesas do Mês"
                value="R$ 56.780"
                change="-3,1%"
                changeType="positive"
                icon={<TrendingDown className="h-4 w-4" />}
              />
              <StatsCard
                title="Contas a Receber"
                value="R$ 38.920"
                change="+15,8%"
                changeType="positive"
                icon={<CreditCard className="h-4 w-4" />}
              />
            </div>

            {/* Charts and content */}
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-7 mb-8">
              <CashFlowChart />
              <RecentTransactions />
            </div>

            {/* Bottom section */}
            <div className="grid gap-6 md:grid-cols-4">
              <QuickActions />
              
              {/* Additional cards can be added here */}
              <div className="col-span-3">
                {/* Placeholder for additional content */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
