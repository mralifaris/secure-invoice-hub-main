/**
 * Admin Panel
 * 
 * Administrative dashboard for system management.
 * Includes user management, system analytics, and audit logs.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getUsers, User, updateUserRole, deleteUserAccount } from '@/services/firebaseService';
import { getAllInvoices, getInvoiceStats, Invoice } from '@/services/mongoService';
import { getBlockchainStats } from '@/services/blockchainService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  FileText, 
  Activity, 
  Trash2, 
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  TrendingUp,
  Database,
  Blocks,
  Home
} from 'lucide-react';

// Simulated audit logs
const AUDIT_LOGS = [
  { id: 1, action: 'User Login', user: 'admin@invoicechain.com', timestamp: '2024-01-05 14:30:00', type: 'auth' },
  { id: 2, action: 'Invoice Created', user: 'user@test.com', timestamp: '2024-01-05 14:25:00', type: 'invoice' },
  { id: 3, action: 'Blockchain Hash Generated', user: 'system', timestamp: '2024-01-05 14:25:01', type: 'blockchain' },
  { id: 4, action: 'AI Analysis Completed', user: 'system', timestamp: '2024-01-05 14:25:02', type: 'ai' },
  { id: 5, action: 'User Registered', user: 'newuser@test.com', timestamp: '2024-01-05 12:00:00', type: 'auth' },
  { id: 6, action: 'Invoice Status Updated', user: 'user@test.com', timestamp: '2024-01-05 11:45:00', type: 'invoice' },
  { id: 7, action: 'Hash Verification Request', user: 'user@test.com', timestamp: '2024-01-05 11:30:00', type: 'blockchain' },
  { id: 8, action: 'Fraud Detection Alert', user: 'system', timestamp: '2024-01-05 10:15:00', type: 'ai' },
];

const AdminPanel = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0, totalRevenue: 0, pendingRevenue: 0 });
  const [blockchainStats, setBlockchainStats] = useState({ totalBlocks: 0, totalTransactions: 0, lastBlockTime: '', chainIntegrity: true });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setUsers(getUsers());
    const invoiceData = await getAllInvoices();
    setInvoices(invoiceData);
    const statsData = await getInvoiceStats();
    setStats(statsData);
    const bcStats = await getBlockchainStats();
    setBlockchainStats(bcStats);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'business' | 'user') => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast({
        title: 'Role Updated',
        description: 'User role has been updated successfully.',
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUserAccount(userId);
    if (result.success) {
      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully.',
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'auth': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Auth</Badge>;
      case 'invoice': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Invoice</Badge>;
      case 'blockchain': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Blockchain</Badge>;
      case 'ai': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">AI</Badge>;
      default: return <Badge variant="outline">System</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Admin</Badge>;
      case 'business': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Business</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">User</Badge>;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-amber-100 text-sm">System Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm hidden sm:inline">Logged in as: {user?.email}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Blocks className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blockchain Blocks</p>
                  <p className="text-2xl font-bold">{blockchainStats.totalBlocks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-lg font-bold text-green-600">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Database className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Change Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.uid}>
                        <TableCell className="font-medium">{u.displayName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.role}
                            onValueChange={(value) => handleRoleChange(u.uid, value as 'admin' | 'business' | 'user')}
                            disabled={u.uid === user?.uid}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={u.uid === user?.uid}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {u.displayName}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(u.uid)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Statistics</CardTitle>
                  <CardDescription>Overview of invoice status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Paid</span>
                      </div>
                      <span className="font-bold">{stats.paid}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all" 
                        style={{ width: `${stats.total ? (stats.paid / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>Pending</span>
                      </div>
                      <span className="font-bold">{stats.pending}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full transition-all" 
                        style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Overdue</span>
                      </div>
                      <span className="font-bold">{stats.overdue}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all" 
                        style={{ width: `${stats.total ? (stats.overdue / stats.total) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Pending Revenue</span>
                        <span className="font-bold text-amber-600">${stats.pendingRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Firebase Auth</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>MongoDB Storage</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Blockchain Network</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {blockchainStats.chainIntegrity ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>AI Service</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and security logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AUDIT_LOGS.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{getLogTypeBadge(log.type)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/invoices')}>
                <FileText className="h-4 w-4 mr-2" />
                View All Invoices
              </Button>
              <Button variant="outline" onClick={() => navigate('/verify')}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Verify Blockchain
              </Button>
              <Button variant="outline" onClick={loadData}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
