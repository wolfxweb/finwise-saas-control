import { StatsCard } from "@/components/dashboard/StatsCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

const Index = () => {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts and Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
};

export default Index;
