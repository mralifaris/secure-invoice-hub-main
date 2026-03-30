import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import InvoiceStatusBadge from '@/components/invoice/InvoiceStatusBadge';
import RiskBadge from '@/components/invoice/RiskBadge';
import BlockchainBadge from '@/components/invoice/BlockchainBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { getInvoiceById, Invoice, updateInvoiceStatus } from '@/services/mongoService';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Blocks,
  Brain,
  CheckCircle,
  Shield,
  User,
  Calendar,
  Mail,
  MapPin,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return;
      try {
        const data = await getInvoiceById(id);
        setInvoice(data);
      } catch (error) {
        console.error('Failed to load invoice:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!invoice) return;
    
    const updated = await updateInvoiceStatus(invoice.id, newStatus);
    if (updated) {
      setInvoice(updated);
      toast({
        title: 'Status Updated',
        description: `Invoice marked as ${newStatus}`,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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

  if (!invoice) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
          <h2 className="text-xl font-semibold">Invoice Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The invoice you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/invoices">
            <Button className="mt-4">Back to Invoices</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-muted-foreground">
                Created {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'pending' && (
              <Button onClick={() => handleStatusChange('paid')} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            <Link to="/verify">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Verify
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Parties */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-foreground">{invoice.sender.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {invoice.sender.email}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {invoice.sender.address}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-foreground">{invoice.receiver.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {invoice.receiver.email}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {invoice.receiver.address}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Subtotal</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3}>Tax</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.tax)}</TableCell>
                    </TableRow>
                    <TableRow className="text-lg font-bold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date */}
            <Card className="shadow-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-accent p-2">
                  <Calendar className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Blocks className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Blockchain Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">Verified on Blockchain</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Transaction Hash</p>
                  <code className="block break-all rounded bg-muted p-2 text-xs">
                    {invoice.blockchainHash}
                  </code>
                </div>
                <BlockchainBadge hash={invoice.blockchainHash} showFull />
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fraud Risk</span>
                  <RiskBadge risk={invoice.aiAnalysis.fraudRisk} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <Badge variant="secondary">{invoice.aiAnalysis.confidence}%</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Analysis Summary</p>
                  <p className="text-sm text-muted-foreground">{invoice.aiAnalysis.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Created By */}
            <Card className="shadow-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-secondary p-2">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{invoice.createdBy}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceDetail;
