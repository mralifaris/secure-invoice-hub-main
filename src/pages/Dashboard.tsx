import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import InvoiceStatusBadge from '@/components/invoice/InvoiceStatusBadge';
import RiskBadge from '@/components/invoice/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInvoiceStats, getAllInvoices, Invoice } from '@/services/mongoService';
import { getBlockchainStats } from '@/services/blockchainService';
import { getAIServiceStatus } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Blocks,
  Brain,
  Plus,
  ArrowRight,
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [blockchainStats, setBlockchainStats] = useState({
    totalBlocks: 0,
    totalTransactions: 0,
    chainIntegrity: true,
  });
  const [aiStatus, setAIStatus] = useState<{
    status: 'online' | 'offline' | 'degraded';
    accuracy: number;
  }>({
    status: 'online',
    accuracy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Admin sees all data, business/user sees only their own
        const userId = isAdmin ? undefined : user?.uid;

        const [invoiceStats, invoices, bcStats, aiStatusData] = await Promise.all([
          getInvoiceStats(userId),
          getAllInvoices(userId),
          getBlockchainStats(),
          getAIServiceStatus(),
        ]);

        setStats(invoiceStats);
        setRecentInvoices(invoices.slice(0, 5));
        setBlockchainStats(bcStats);
        setAIStatus(aiStatusData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isAdmin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'System-wide overview' : `Welcome, ${user?.displayName}`}
            </p>
          </div>
          <Link to="/invoices/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={isAdmin ? 'Total Invoices' : 'My Invoices'}
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title="Paid"
            value={stats.paid}
            subtitle={formatCurrency(stats.totalRevenue)}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            subtitle={formatCurrency(stats.pendingRevenue)}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="destructive"
          />
        </div>

        {/* System Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Blockchain Status */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Blocks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Blockchain Status</CardTitle>
                  <CardDescription>Distributed ledger health</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Blocks</span>
                  <span className="font-medium">{blockchainStats.totalBlocks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-medium">{blockchainStats.totalTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chain Integrity</span>
                  <span className="flex items-center gap-1 font-medium text-success">
                    <CheckCircle className="h-4 w-4" />
                    Valid
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Status */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-accent p-2">
                  <Brain className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Analysis Engine</CardTitle>
                  <CardDescription>Fraud detection system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="flex items-center gap-1 font-medium text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model Accuracy</span>
                  <span className="font-medium">{aiStatus.accuracy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-medium">FraudNet-v2.1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
              <CardDescription>
                {isAdmin ? 'Latest system-wide activity' : 'Your latest invoice activity'}
              </CardDescription>
            </div>
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.receiver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                    <RiskBadge risk={invoice.aiAnalysis.fraudRisk} showIcon={false} />
                  </div>
                </Link>
              ))}

              {recentInvoices.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No invoices yet</p>
                  <Link to="/invoices/create">
                    <Button variant="link" className="mt-2">
                      Create your first invoice
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;