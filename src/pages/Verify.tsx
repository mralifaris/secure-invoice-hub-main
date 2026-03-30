import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { verifyHash, verifyInvoice, VerificationResult } from '@/services/blockchainService';
import { getInvoiceById, Invoice } from '@/services/mongoService';
import InvoiceStatusBadge from '@/components/invoice/InvoiceStatusBadge';
import RiskBadge from '@/components/invoice/RiskBadge';
import {
  Shield,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Blocks,
  Hash,
  FileText,
} from 'lucide-react';

const Verify = () => {
  const [hashInput, setHashInput] = useState('');
  const [invoiceIdInput, setInvoiceIdInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);

  const handleHashVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;

    setIsVerifying(true);
    setResult(null);
    setInvoiceData(null);

    try {
      const verificationResult = await verifyHash(hashInput.trim());
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInvoiceVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceIdInput.trim()) return;

    setIsVerifying(true);
    setResult(null);
    setInvoiceData(null);

    try {
      // Get invoice data
      const invoice = await getInvoiceById(invoiceIdInput.trim());
      if (invoice) {
        setInvoiceData(invoice);
      }

      // Verify on blockchain
      const verificationResult = await verifyInvoice(invoiceIdInput.trim());
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invoice Verification</h1>
          <p className="text-muted-foreground">
            Verify invoice authenticity using blockchain records
          </p>
        </div>

        {/* Verification Form */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Verify Invoice</CardTitle>
            <CardDescription>
              Enter a blockchain hash or invoice ID to verify authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hash" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hash" className="gap-2">
                  <Hash className="h-4 w-4" />
                  By Hash
                </TabsTrigger>
                <TabsTrigger value="invoice" className="gap-2">
                  <FileText className="h-4 w-4" />
                  By Invoice ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hash">
                <form onSubmit={handleHashVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hash">Blockchain Hash</Label>
                    <Input
                      id="hash"
                      placeholder="0x7F3A9C2E1B5D4F8A..."
                      value={hashInput}
                      onChange={(e) => setHashInput(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full 66-character blockchain hash (starting with 0x)
                    </p>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isVerifying}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Verify Hash
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="invoice">
                <form onSubmit={handleInvoiceVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceId">Invoice ID or Number</Label>
                    <Input
                      id="invoiceId"
                      placeholder="INV-2024-001 or inv_001"
                      value={invoiceIdInput}
                      onChange={(e) => setInvoiceIdInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the invoice number (e.g., INV-2024-001) or internal ID
                    </p>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isVerifying}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Verify Invoice
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {result && (
          <Card
            className={`animate-fade-in shadow-elevated ${
              result.isValid
                ? 'border-success/30 bg-success/5'
                : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                    result.isValid ? 'bg-success/20' : 'bg-destructive/20'
                  } animate-blockchain-verify`}
                >
                  {result.isValid ? (
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>

                <h3
                  className={`text-xl font-bold ${
                    result.isValid ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {result.isValid ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                <p className="mt-2 text-muted-foreground">{result.message}</p>

                {result.block && (
                  <div className="mt-4 w-full rounded-lg bg-card p-4 text-left">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Blocks className="h-4 w-4" />
                      Block #{result.block.index}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recorded: {new Date(result.block.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Details (when verifying by ID) */}
        {invoiceData && result?.isValid && (
          <Card className="animate-fade-in shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-semibold">{invoiceData.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <InvoiceStatusBadge status={invoiceData.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(invoiceData.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sender</span>
                <span>{invoiceData.sender.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Receiver</span>
                <span>{invoiceData.receiver.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Risk Assessment</span>
                <RiskBadge risk={invoiceData.aiAnalysis.fraudRisk} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-accent/30">
          <CardContent className="flex items-start gap-4 p-4">
            <Blocks className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium">How Blockchain Verification Works</p>
              <p className="mt-1 text-muted-foreground">
                Each invoice is assigned a unique cryptographic hash when created. This hash is
                recorded on our distributed blockchain ledger, ensuring the invoice data cannot
                be tampered with. Verification checks the hash against our blockchain records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Verify;
