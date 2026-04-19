import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import InvoiceStatusBadge from '@/components/invoice/InvoiceStatusBadge';
import RiskBadge from '@/components/invoice/RiskBadge';
import BlockchainBadge from '@/components/invoice/BlockchainBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getAllInvoices, Invoice } from '@/services/mongoService';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, FileText, Eye } from 'lucide-react';

const InvoiceList = () => {
  const { user, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        let data: Invoice[];
        if (isAdmin) {
          // Admin sees everything
          data = await getAllInvoices();
        } else {
          // Non-admin sees invoices they sent OR received
          data = await getAllInvoices(user?.uid, user?.email);
        }
        setInvoices(data);
        setFilteredInvoices(data);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [user, isAdmin]);

  useEffect(() => {
    let result = invoices;

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.receiver.name.toLowerCase().includes(term) ||
          inv.sender.name.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(result);
  }, [invoices, searchTerm, statusFilter]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Tell the user if they are the sender or receiver of each invoice
  const getRole = (invoice: Invoice) => {
    if (!user) return null;
    if (invoice.createdBy === user.uid) return 'sent';
    if (invoice.receiver.email.toLowerCase() === user.email.toLowerCase()) return 'received';
    return null;
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
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'All invoices in the system' : 'Invoices you sent or received'}
            </p>
          </div>
          <Link to="/invoices/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {isAdmin ? 'All Invoices' : 'My Invoice History'}
            </CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      {!isAdmin && <TableHead>Role</TableHead>}
                      {isAdmin && <TableHead>Created By</TableHead>}
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>

                        {/* Role badge for non-admin */}
                        {!isAdmin && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                getRole(invoice) === 'sent'
                                  ? 'text-blue-600 border-blue-300'
                                  : 'text-green-600 border-green-300'
                              }
                            >
                              {getRole(invoice) === 'sent' ? 'Sent' : 'Received'}
                            </Badge>
                          </TableCell>
                        )}

                        {/* Created by for admin */}
                        {isAdmin && (
                          <TableCell className="text-xs text-muted-foreground">
                            {invoice.createdBy}
                          </TableCell>
                        )}

                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.receiver.name}</p>
                            <p className="text-xs text-muted-foreground">{invoice.receiver.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                        <TableCell><RiskBadge risk={invoice.aiAnalysis.fraudRisk} /></TableCell>
                        <TableCell><BlockchainBadge hash={invoice.blockchainHash} /></TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground">No invoices found</h3>
                <p className="mt-1 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first invoice'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link to="/invoices/create">
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Create Invoice
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvoiceList;