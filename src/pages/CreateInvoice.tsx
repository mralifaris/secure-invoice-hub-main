import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createInvoice, InvoiceItem } from '@/services/mongoService';
import { getUsers } from '@/services/firebaseService';
import { Plus, Trash2, Loader2, FileText, Blocks, Brain, CheckCircle2, XCircle } from 'lucide-react';

const CreateInvoice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiverStatus, setReceiverStatus] = useState<'idle' | 'checking' | 'found' | 'notfound'>('idle');
  const [receiverCheckTimeout, setReceiverCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    sender: { name: '', email: '', address: '' },
    receiver: { name: '', email: '', address: '' },
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
    taxRate: 10,
    dueDate: '',
    status: 'pending' as const,
  });

  // ─── Check if receiver email exists in our system ─────────────────────────
  const checkReceiverEmail = (email: string) => {
    if (receiverCheckTimeout) clearTimeout(receiverCheckTimeout);

    if (!email || !email.includes('@')) {
      setReceiverStatus('idle');
      return;
    }

    setReceiverStatus('checking');

    const timeout = setTimeout(async () => {
      try {
        const users = await getUsers();
        const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
        setReceiverStatus(exists ? 'found' : 'notfound');
      } catch {
        setReceiverStatus('idle');
      }
    }, 600); // debounce 600ms

    setReceiverCheckTimeout(timeout);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (formData.taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    // Block if receiver is not in our system
    if (receiverStatus === 'notfound') {
      toast({
        title: 'Receiver Not Found',
        description: 'The receiver email is not registered in our system. They must sign up first.',
        variant: 'destructive',
      });
      return;
    }

    if (receiverStatus === 'checking') {
      toast({
        title: 'Please wait',
        description: 'Still verifying receiver email...',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const invoice = await createInvoice(
        {
          sender: formData.sender,
          receiver: formData.receiver,
          items: formData.items,
          subtotal,
          tax,
          total,
          status: formData.status,
          dueDate: formData.dueDate,
          createdBy: user.uid,
        },
        user.uid
      );

      toast({
        title: 'Invoice Created!',
        description: (
          <div className="space-y-1">
            <p>{invoice.invoiceNumber} has been created successfully.</p>
            <p className="text-xs text-muted-foreground">
              Receiver will be notified when they log in.
            </p>
          </div>
        ),
      });

      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Receiver email status indicator
  const ReceiverEmailStatus = () => {
    if (receiverStatus === 'idle') return null;
    if (receiverStatus === 'checking') return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking...
      </p>
    );
    if (receiverStatus === 'found') return (
      <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
        <CheckCircle2 className="h-3 w-3" /> Registered user — invoice will be delivered
      </p>
    );
    if (receiverStatus === 'notfound') return (
      <p className="flex items-center gap-1 text-xs text-destructive mt-1">
        <XCircle className="h-3 w-3" /> Not registered in our system
      </p>
    );
    return null;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice with blockchain verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sender & Receiver */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sender */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">From (Sender)</CardTitle>
                <CardDescription>Your business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Business Name</Label>
                  <Input
                    id="senderName"
                    value={formData.sender.name}
                    onChange={(e) => setFormData({ ...formData, sender: { ...formData.sender, name: e.target.value } })}
                    placeholder="Your Company Ltd"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={formData.sender.email}
                    onChange={(e) => setFormData({ ...formData, sender: { ...formData.sender, email: e.target.value } })}
                    placeholder="billing@yourcompany.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderAddress">Address</Label>
                  <Input
                    id="senderAddress"
                    value={formData.sender.address}
                    onChange={(e) => setFormData({ ...formData, sender: { ...formData.sender, address: e.target.value } })}
                    placeholder="123 Business St, City, Country"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Receiver */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">To (Receiver)</CardTitle>
                <CardDescription>Client details — must be registered in our system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiverName">Client Name</Label>
                  <Input
                    id="receiverName"
                    value={formData.receiver.name}
                    onChange={(e) => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })}
                    placeholder="Client Company Inc"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverEmail">Email</Label>
                  <Input
                    id="receiverEmail"
                    type="email"
                    value={formData.receiver.email}
                    onChange={(e) => {
                      setFormData({ ...formData, receiver: { ...formData.receiver, email: e.target.value } });
                      checkReceiverEmail(e.target.value);
                    }}
                    placeholder="accounts@client.com"
                    className={
                      receiverStatus === 'found'
                        ? 'border-green-500 focus-visible:ring-green-500'
                        : receiverStatus === 'notfound'
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                    required
                  />
                  <ReceiverEmailStatus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverAddress">Address</Label>
                  <Input
                    id="receiverAddress"
                    value={formData.receiver.address}
                    onChange={(e) => setFormData({ ...formData, receiver: { ...formData.receiver, address: e.target.value } })}
                    placeholder="456 Client Ave, City, Country"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Items</CardTitle>
              <CardDescription>Add products or services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Service or product description"
                      required
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Total</Label>
                    <Input value={formatCurrency(item.total)} disabled className="bg-muted" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Summary & Options */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Invoice Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({formData.taxRate}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg bg-accent/50 p-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Blocks className="h-4 w-4" />
                    <span>Blockchain hash will be generated</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    <span>AI fraud analysis will be performed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || receiverStatus === 'notfound' || receiverStatus === 'checking'}
              className="gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Creating...</>
              ) : (
                <><FileText className="h-4 w-4" />Create Invoice</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateInvoice;