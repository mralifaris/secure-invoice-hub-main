import { ReactNode } from 'react';
import Navbar from './Navbar';
import InvoiceNotification from '../invoice/Invoicenotification';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <InvoiceNotification />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default Layout;