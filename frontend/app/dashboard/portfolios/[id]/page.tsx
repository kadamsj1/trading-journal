'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portfoliosApi, tradesApi, chargesApi, brokersApi, vaultApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  ArrowLeft,
  Calendar,
  Layers,
  Activity,
  ExternalLink,
  Target,
  History,
  Receipt,
  RefreshCw,
  Wallet,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';
import { useToast } from '@/components/ui/use-toast';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  initial_balance: number;
}

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  status: string;
  entry_price: number;
  entry_date: string;
  exit_price: number | null;
  exit_date: string | null;
  quantity: number;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
  notes: string | null;
}

interface DailyCharge {
  id: number;
  portfolio_id: number;
  date: string;
  amount: number;
  notes: string | null;
}

interface VaultTransaction {
  id: number;
  portfolio_id: number;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  notes: string | null;
  is_auto?: boolean;
  source?: string;  // manual | day_close_pnl | day_close_charges
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [charges, setCharges] = useState<DailyCharge[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal state — charges
  const [chargesModal, setChargesModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<DailyCharge | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargeNotes, setChargeNotes] = useState('');
  const [chargesLoading, setChargesLoading] = useState(false);
  const [syncModal, setSyncModal] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [syncToDate, setSyncToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);

  // Vault / Ledger state
  const [vaultTransactions, setVaultTransactions] = useState<VaultTransaction[]>([]);
  const [vaultModal, setVaultModal] = useState(false);
  const [editingVault, setEditingVault] = useState<VaultTransaction | null>(null);
  const [vaultType, setVaultType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultDate, setVaultDate] = useState(new Date().toISOString().split('T')[0]);
  const [vaultNotes, setVaultNotes] = useState('');
  const [vaultLoading, setVaultLoading] = useState(false);

  // Day Close state
  const [dayCloseModal, setDayCloseModal] = useState(false);
  const [dayCloseDate, setDayCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayClosePreview, setDayClosePreview] = useState<any>(null);
  const [dayCloseLoading, setDayCloseLoading] = useState(false);
  const [dayCloseExecuting, setDayCloseExecuting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [portfolioId]);

  const fetchAll = async () => {
    try {
      const [portRes, tradeRes, chargeRes, brokerRes, vaultRes] = await Promise.all([
        portfoliosApi.getById(portfolioId),
        tradesApi.getByPortfolio(portfolioId),
        chargesApi.getByPortfolio(portfolioId),
        brokersApi.getAll().catch(() => ({ data: [] })),
        vaultApi.getByPortfolio(portfolioId).catch(() => ({ data: [] })),
      ]);
      setPortfolio(portRes.data);
      setTrades(tradeRes.data);
      setCharges(chargeRes.data);
      setBrokers(brokerRes.data);
      setVaultTransactions(vaultRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Vault handlers ───────────────────────────────────────────
  const openAddVault = (type: 'deposit' | 'withdrawal') => {
    setEditingVault(null);
    setVaultType(type);
    setVaultAmount('');
    setVaultDate(new Date().toISOString().split('T')[0]);
    setVaultNotes('');
    setVaultModal(true);
  };

  const openEditVault = (t: VaultTransaction) => {
    setEditingVault(t);
    setVaultType(t.transaction_type);
    setVaultAmount(String(t.amount));
    setVaultDate(t.date);
    setVaultNotes(t.notes || '');
    setVaultModal(true);
  };

  const handleVaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(vaultAmount);
    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
      return;
    }
    setVaultLoading(true);
    try {
      if (editingVault) {
        await vaultApi.update(editingVault.id, { transaction_type: vaultType, amount, date: vaultDate, notes: vaultNotes || undefined });
        toast({ title: '✅ Updated', description: `Transaction updated successfully.` });
      } else {
        await vaultApi.create(portfolioId, { transaction_type: vaultType, amount, date: vaultDate, notes: vaultNotes || undefined });
        toast({ title: `✅ ${vaultType === 'deposit' ? 'Deposit' : 'Withdrawal'} Saved`, description: `₹${amount.toLocaleString('en-IN')} recorded.` });
      }
      setVaultModal(false);
      fetchAll();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        : (typeof detail === 'string' ? detail : 'Could not save transaction.');
      toast({ variant: 'destructive', title: 'Error', description: errorMsg });
    } finally {
      setVaultLoading(false);
    }
  };

  const handleDeleteVault = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await vaultApi.delete(id);
      toast({ title: 'Deleted', description: 'Transaction removed.' });
      fetchAll();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete transaction.' });
    }
  };

  // ── Day Close handlers ──────────────────────────────────────
  const openDayClose = () => {
    const today = new Date().toISOString().split('T')[0];
    setDayCloseDate(today);
    setDayClosePreview(null);
    setDayCloseModal(true);
    // Auto-fetch preview for today immediately
    setTimeout(() => fetchDayClosePreview(today), 0);
  };

  const fetchDayClosePreview = async (date: string) => {
    if (!date) return;
    setDayCloseLoading(true);
    try {
      const res = await vaultApi.dayClosePreview(portfolioId, date);
      setDayClosePreview(res.data);
    } catch {
      setDayClosePreview(null);
    } finally {
      setDayCloseLoading(false);
    }
  };

  const handleDayCloseExecute = async () => {
    setDayCloseExecuting(true);
    try {
      const res = await vaultApi.dayCloseExecute(portfolioId, dayCloseDate);
      toast({ title: '✅ Day Close Done', description: res.data.message });
      setDayCloseModal(false);
      fetchAll();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast({
        variant: 'destructive',
        title: 'Day Close Failed',
        description: typeof detail === 'string' ? detail : 'Could not execute day close.',
      });
    } finally {
      setDayCloseExecuting(false);
    }
  };

  const openAddModal = () => {
    setEditingCharge(null);
    setChargeAmount('');
    setChargeDate(new Date().toISOString().split('T')[0]);
    setChargeNotes('');
    setChargesModal(true);
  };

  const openEditModal = (charge: DailyCharge) => {
    setEditingCharge(charge);
    setChargeAmount(String(charge.amount));
    setChargeDate(charge.date);
    setChargeNotes(charge.notes || '');
    setChargesModal(true);
  };

  const handleChargesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(chargeAmount);
    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid charges amount.' });
      return;
    }
    setChargesLoading(true);
    try {
      if (editingCharge) {
        await chargesApi.update(editingCharge.id, { amount, date: chargeDate, notes: chargeNotes || undefined });
        toast({ title: '✅ Charges Updated', description: `Charges for ${format(new Date(chargeDate), 'dd MMM yyyy')} updated.` });
      } else {
        await chargesApi.create({ portfolio_id: portfolioId, date: chargeDate, amount, notes: chargeNotes || undefined });
        toast({ title: '✅ Charges Saved', description: `₹${amount} saved for ${format(new Date(chargeDate), 'dd MMM yyyy')}.` });
      }
      setChargesModal(false);
      fetchAll();
    } catch (err: any) {
      const d = err?.response?.data?.detail;
      const msg = Array.isArray(d) ? d.map((e: any) => e.msg || String(e)).join(', ') : (typeof d === 'string' ? d : 'Could not save charges.');
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setChargesLoading(false);
    }
  };

  const handleDeleteCharge = async (id: number) => {
    if (!confirm('Delete this charge entry?')) return;
    try {
      await chargesApi.delete(id);
      toast({ title: 'Deleted', description: 'Charge entry removed.' });
      fetchAll();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete charge.' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/trades/portfolio/${portfolioId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio_${portfolioId}_trades.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: '✅ Export Success', description: 'Your trade data has been downloaded.' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Error', description: 'Failed to download CSV data.' });
    }
  };

  const openSyncModal = (brokerId: number) => {
    setSelectedBroker(brokerId);
    setSyncModal(true);
  };

  const handleSyncBroker = async () => {
    if (!selectedBroker) return;
    setSyncing(true);
    try {
      const res = await brokersApi.sync(selectedBroker, portfolioId, syncFromDate, syncToDate);
      const { message, count, updated, total_at_broker, status } = res.data;
      toast({
        title: status === 'VERIFIED' ? '✅ SYNC VERIFIED' : '⚠️ SYNC PARTIAL',
        description: `${message} (Broker Total: ${total_at_broker})`
      });
      setSyncModal(false);
      fetchAll();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Broker sync failed.';
      toast({ variant: 'destructive', title: 'Sync Error', description: msg });
    } finally {
      setSyncing(false);
    }
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0).length;
  const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) <= 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
  const totalDeposits = vaultTransactions.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = vaultTransactions.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const currentBalance = totalDeposits - totalWithdrawals + totalPL - totalCharges;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium animate-pulse">Accessing Vault Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 border bg-card hover:bg-muted"
            onClick={() => router.push('/dashboard/portfolios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter">{portfolio?.name}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {portfolio?.description || 'Active trading vault with automated tracking.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"
            className="h-12 px-6 rounded-2xl font-bold gap-2 border-orange-400/40 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/60 transition-all"
            onClick={openAddModal}
          >
            <Receipt className="h-5 w-5" />
            Add Charges
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/40 text-primary hover:bg-primary/5 transition-all"
            onClick={handleExportCSV}
          >
            <History className="h-5 w-5" />
            Export CSV
          </Button>
          {brokers.length > 0 ? (
            <Button
              variant="outline"
              disabled={syncing}
              className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/40 text-primary hover:bg-primary/5 transition-all"
              onClick={() => openSyncModal(brokers[0].id)}
            >
              <RefreshCw className={cn("h-5 w-5", syncing && "animate-spin")} />
              {syncing ? 'Syncing...' : `Sync ${brokers[0].broker_name}`}
            </Button>
          ) : (
            <Link href="/dashboard/brokers">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/10 text-muted-foreground hover:text-primary transition-all"
              >
                <Zap className="h-5 w-5 text-primary opacity-50" />
                Link Broker
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/portfolios/${portfolioId}/calendar`}>
            <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/40 text-primary hover:bg-primary/5 transition-all">
              <Calendar className="h-5 w-5" />
              Trading Calendar
            </Button>
          </Link>
          <Link href={`/dashboard/portfolios/${portfolioId}/trades/new`}>
            <Button className="h-12 px-6 rounded-2xl font-bold gap-2">
              <Plus className="h-5 w-5" />
              Execute Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-5">
        <HeaderStatCard
          label="Capital Credit"
          value={formatINR(totalDeposits)}
          icon={<History className="h-4 w-4" />}
          subtitle={`${vaultTransactions.filter(t => t.transaction_type === 'deposit').length} credit(s)`}
        />
        <HeaderStatCard label="Closed P&L" value={formatINR(totalPL)}
          icon={totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          color={totalPL >= 0 ? 'text-green-600' : 'text-red-600'} trend={totalPL >= 0 ? 'bullish' : 'bearish'} />
        <HeaderStatCard label="Win Ratio" value={`${winRate.toFixed(1)}%`}
          icon={<Target className="h-4 w-4" />} subtitle={`${winningTrades}W / ${losingTrades}L`} />
        <HeaderStatCard label="Total Charges" value={formatINR(totalCharges)}
          icon={<Receipt className="h-4 w-4" />} color="text-orange-500" subtitle={`${charges.length} day entries`} />
        <HeaderStatCard label="Current Balance" value={formatINR(currentBalance)}
          icon={<Wallet className="h-4 w-4" />}
          color={currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}
          trend={currentBalance >= 0 ? 'bullish' : 'bearish'}
          subtitle={`+${formatINR(totalDeposits)} / -${formatINR(totalWithdrawals)}`} />
      </div>

      {/* Tabs */}
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-card to-background">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl grid grid-cols-5 md:w-[680px]">
              <TabsTrigger value="all" className="rounded-xl font-bold">All Orders</TabsTrigger>
              <TabsTrigger value="open" className="rounded-xl font-bold">Open Active</TabsTrigger>
              <TabsTrigger value="closed" className="rounded-xl font-bold">History Log</TabsTrigger>
              <TabsTrigger value="charges" className="rounded-xl font-bold">Charges</TabsTrigger>
              <TabsTrigger value="vault" className="rounded-xl font-bold">📒 Ledger</TabsTrigger>
            </TabsList>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1.5 rounded-full">Automated sync</span>
          </div>

          <div className="p-4 md:p-8">
            <TabsContent value="all" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={trades} portfolioId={portfolioId} onRefresh={fetchAll} />
            </TabsContent>
            <TabsContent value="open" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={openTrades} portfolioId={portfolioId} onRefresh={fetchAll} />
            </TabsContent>
            <TabsContent value="closed" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={closedTrades} portfolioId={portfolioId} onRefresh={fetchAll} />
            </TabsContent>

            {/* ── Charges Tab ─────────────────────────────────── */}
            <TabsContent value="charges" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {charges.length > 0 ? (
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="font-black text-[11px] uppercase tracking-widest h-14">Date</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right text-orange-500">Amount</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest h-14">Notes</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charges.map(c => (
                        <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors h-16">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black text-base tracking-tight">{format(new Date(c.date), 'dd MMM yyyy')}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                                {format(new Date(c.date), 'EEEE')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-black text-lg text-orange-500 italic">{formatINR(c.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{c.notes || '—'}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm"
                                className="h-8 px-3 rounded-lg text-xs font-bold hover:bg-orange-500/10 hover:text-orange-500"
                                onClick={() => openEditModal(c)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10"
                                onClick={() => handleDeleteCharge(c.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Total row */}
                  <div className="border-t-2 bg-muted/10 px-6 py-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Total — {charges.length} entries
                    </span>
                    <span className="text-2xl font-black italic text-orange-500">{formatINR(totalCharges)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-orange-400 opacity-60" />
                  </div>
                  <h3 className="text-xl font-black mb-1">No Charges Recorded</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-[240px] mb-6">
                    Add daily brokerage, STT, GST and tax charges.
                  </p>
                  <Button variant="outline"
                    className="border-orange-400/40 text-orange-500 hover:bg-orange-500/10 gap-2"
                    onClick={openAddModal}>
                    <Plus className="h-4 w-4" /> Add First Entry
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ── Ledger Book Tab ────────────────────────────────── */}
            <TabsContent value="vault" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Ledger header bar */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-black tracking-tight">Capital Ledger</h3>
                  <p className="text-[11px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">All debit &amp; credit entries</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openDayClose}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-violet-500/10 text-violet-600 border border-violet-500/30 hover:bg-violet-500/20 transition-all"
                  >
                    <Zap className="h-3.5 w-3.5" /> Day Close
                  </button>
                  <button
                    onClick={() => openAddVault('deposit')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                  >
                    <ArrowDownCircle className="h-3.5 w-3.5" /> Credit Entry
                  </button>
                  <button
                    onClick={() => openAddVault('withdrawal')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20 transition-all"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" /> Debit Entry
                  </button>
                </div>
              </div>

              {vaultTransactions.length > 0 ? (
                <div className="rounded-2xl border-2 bg-card overflow-hidden">
                  {/* Ledger title strip */}
                  <div className="bg-gradient-to-r from-primary/5 to-transparent border-b-2 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📒</span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Ledger Book — {portfolio?.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">{vaultTransactions.length} entries</span>
                  </div>

                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr className="border-b">
                        <th className="font-black text-[10px] uppercase tracking-widest h-11 px-5 text-left text-muted-foreground w-[130px]">Date</th>
                        <th className="font-black text-[10px] uppercase tracking-widest h-11 px-5 text-left text-muted-foreground">Narration</th>
                        <th className="font-black text-[10px] uppercase tracking-widest h-11 px-5 text-right text-red-500 w-[140px]">Debit (Dr)</th>
                        <th className="font-black text-[10px] uppercase tracking-widest h-11 px-5 text-right text-emerald-600 w-[140px]">Credit (Cr)</th>
                        <th className="font-black text-[10px] uppercase tracking-widest h-11 px-5 text-right text-primary w-[160px]">Balance</th>
                        <th className="w-[80px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Opening balance row */}
                      <tr className="border-b bg-muted/10">
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Opening</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-muted-foreground italic">Opening Balance</span>
                        </td>
                        <td className="px-5 py-3 text-right">—</td>
                        <td className="px-5 py-3 text-right">—</td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-black text-sm text-primary">₹0.00</span>
                        </td>
                        <td></td>
                      </tr>
                      {/* Transaction rows with running balance */}
                      {(() => {
                        let runningBalance = 0;
                        const sorted = [...vaultTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        return sorted.map((t, idx) => {
                          const isCredit = t.transaction_type === 'deposit';
                          runningBalance += isCredit ? t.amount : -t.amount;
                          const isPositive = runningBalance >= 0;
                          return (
                            <tr key={t.id} className={`group border-b last:border-0 hover:bg-primary/5 transition-colors ${
                              idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'
                            }`}>
                              <td className="px-5 py-3.5">
                                <div className="flex flex-col">
                                  <span className="font-black text-sm tracking-tight">{format(new Date(t.date), 'dd MMM yyyy')}</span>
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">{format(new Date(t.date), 'EEE')}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black uppercase tracking-wide ${
                                      isCredit ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                      {t.source === 'day_close_pnl'
                                        ? (isCredit ? 'Day P&L Credit' : 'Day P&L Debit')
                                        : t.source === 'day_close_charges'
                                        ? 'Day Charges Debit'
                                        : (isCredit ? 'Capital Credit' : 'Capital Debit')}
                                    </span>
                                    {t.is_auto && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                        <Zap className="h-2.5 w-2.5" /> AUTO
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-medium">{t.notes || (isCredit ? 'Funds received / deposited' : 'Funds withdrawn / debited')}</span>
                                </div>
                              </td>
                              {/* Debit column */}
                              <td className="px-5 py-3.5 text-right">
                                {!isCredit ? (
                                  <span className="font-black text-red-600 italic">{formatINR(t.amount)}</span>
                                ) : (
                                  <span className="text-muted-foreground opacity-30 text-xs">—</span>
                                )}
                              </td>
                              {/* Credit column */}
                              <td className="px-5 py-3.5 text-right">
                                {isCredit ? (
                                  <span className="font-black text-emerald-600 italic">{formatINR(t.amount)}</span>
                                ) : (
                                  <span className="text-muted-foreground opacity-30 text-xs">—</span>
                                )}
                              </td>
                              {/* Running balance */}
                              <td className="px-5 py-3.5 text-right">
                                <span className={`font-black text-sm ${
                                  isPositive ? 'text-primary' : 'text-red-600'
                                }`}>{isPositive ? '' : '-'}{formatINR(Math.abs(runningBalance))}</span>
                              </td>
                              {/* Actions */}
                              <td className="px-3 py-3.5">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="h-7 px-2 rounded-lg text-[10px] font-black hover:bg-primary/10 hover:text-primary transition-colors uppercase tracking-wide"
                                    onClick={() => openEditVault(t)}>Edit</button>
                                  <button className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                                    onClick={() => handleDeleteVault(t.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>

                  {/* Closing balance / totals footer */}
                  <div className="border-t-2 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="px-6 py-2 border-b bg-muted/20 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                      <div className="flex items-center gap-10">
                        <div className="text-right w-[140px]">
                          <p className="text-[9px] font-black uppercase tracking-widest text-red-500 opacity-70">Total Debit</p>
                          <p className="font-black text-red-600 text-sm">{formatINR(totalWithdrawals)}</p>
                        </div>
                        <div className="text-right w-[140px]">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 opacity-70">Total Credit</p>
                          <p className="font-black text-emerald-600 text-sm">{formatINR(totalDeposits)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Closing Balance</p>
                        <p className="text-[10px] text-muted-foreground opacity-50 font-medium">Credit − Debit</p>
                      </div>
                      <p className={`text-2xl font-black italic ${
                        totalDeposits - totalWithdrawals >= 0 ? 'text-primary' : 'text-red-600'
                      }`}>
                        {totalDeposits - totalWithdrawals >= 0 ? '' : '-'}{formatINR(Math.abs(totalDeposits - totalWithdrawals))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-20 w-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-5 border-2 border-dashed border-primary/20">
                    <span className="text-3xl">📒</span>
                  </div>
                  <h3 className="text-xl font-black mb-1">Ledger is Empty</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-[260px] mb-6">
                    Add your first credit (deposit) or debit (withdrawal) entry to start tracking capital.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => openAddVault('deposit')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
                      <ArrowDownCircle className="h-4 w-4" /> Credit Entry
                    </button>
                    <button onClick={() => openAddVault('withdrawal')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20 transition-all">
                      <ArrowUpCircle className="h-4 w-4" /> Debit Entry
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

      {/* ─── DAY CLOSE MODAL ─────────────────────────────────────── */}
      <Dialog open={dayCloseModal} onOpenChange={(o) => { setDayCloseModal(o); if (!o) setDayClosePreview(null); }}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-b border-violet-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-black">Day Close</DialogTitle>
                <DialogDescription className="text-[11px] font-medium opacity-70">Auto-post P&amp;L &amp; Charges to Ledger</DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Select Date</label>
              <Input
                type="date"
                value={dayCloseDate}
                onChange={(e) => {
                  setDayCloseDate(e.target.value);
                  fetchDayClosePreview(e.target.value);
                }}
                onBlur={() => fetchDayClosePreview(dayCloseDate)}
                className="rounded-xl font-bold"
              />
            </div>

            {/* Preview panel */}
            {dayCloseLoading && (
              <div className="text-center py-4 text-xs text-muted-foreground font-bold animate-pulse">Loading preview...</div>
            )}
            {dayClosePreview && !dayCloseLoading && (
              <div className="rounded-2xl border-2 overflow-hidden">
                {dayClosePreview.already_closed && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-wide">⚠️ Day close already run for this date</p>
                  </div>
                )}
                <div className="divide-y">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trades Closed</p>
                      <p className="font-black text-sm">{dayClosePreview.trade_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net P&amp;L</p>
                      <p className={`font-black text-sm ${dayClosePreview.pnl_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {dayClosePreview.pnl_amount >= 0 ? '+' : ''}{dayClosePreview.pnl_amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Charges</p>
                    <p className="font-black text-sm text-red-600">
                      {dayClosePreview.charges_amount > 0 ? `-${dayClosePreview.charges_amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground font-medium">
                  {dayClosePreview.pnl_amount !== 0 && <div>• P&amp;L → {dayClosePreview.pnl_amount > 0 ? 'Credit (Cr)' : 'Debit (Dr)'} entry will be posted</div>}
                  {dayClosePreview.charges_amount > 0 && <div>• Charges → Debit (Dr) entry will be posted</div>}
                  {dayClosePreview.pnl_amount === 0 && dayClosePreview.charges_amount === 0 && <div>No P&amp;L or charges found for this date.</div>}
                </div>
              </div>
            )}


            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDayCloseModal(false)}
                className="flex-1 py-2.5 rounded-xl border-2 font-bold text-xs hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDayCloseExecute}
                disabled={dayCloseExecuting || !dayClosePreview || dayClosePreview?.already_closed || (dayClosePreview?.pnl_amount === 0 && dayClosePreview?.charges_amount === 0)}
                className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white font-black text-xs hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="h-3.5 w-3.5" />
                {dayCloseExecuting ? 'Posting...' : 'Execute Day Close'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </Card>

      {/* ─── CHARGES MODAL ─────────────────────────────────────── */}
      <Dialog open={chargesModal} onOpenChange={(open) => { setChargesModal(open); if (!open) setEditingCharge(null); }}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-b border-orange-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">
                  {editingCharge ? 'Edit Charges' : 'Add Daily Charges'}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Brokerage · STT · GST · Exchange Fees
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleChargesSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="charge-amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Total Charges (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-black">₹</span>
                <Input
                  id="charge-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={chargeAmount}
                  onChange={e => setChargeAmount(e.target.value)}
                  className="h-14 pl-8 rounded-xl border-2 border-orange-400/20 bg-orange-500/5 focus:border-orange-400/50 focus:bg-background font-black text-xl text-orange-600 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="charge-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Trading Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  id="charge-date"
                  type="date"
                  value={chargeDate}
                  onChange={e => setChargeDate(e.target.value)}
                  className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background font-bold text-sm transition-all"
                  required
                />
              </div>
              {chargeDate && (
                <p className="text-[10px] text-muted-foreground font-medium opacity-60 pl-1">
                  {format(new Date(chargeDate), 'EEEE, dd MMMM yyyy')}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="charge-notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Notes <span className="opacity-40">(optional)</span>
              </Label>
              <Input
                id="charge-notes"
                placeholder="e.g. Zerodha – STT ₹120, Brokerage ₹80..."
                value={chargeNotes}
                onChange={e => setChargeNotes(e.target.value)}
                className="rounded-xl border-2 bg-muted/20 focus:bg-background text-sm transition-all"
              />
            </div>

            {/* Preview */}
            {chargeAmount && parseFloat(chargeAmount) > 0 && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Saving</p>
                  <p className="text-xl font-black text-orange-500 italic">{formatINR(parseFloat(chargeAmount))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">For</p>
                  <p className="text-sm font-black">{chargeDate ? format(new Date(chargeDate), 'dd MMM') : '—'}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl font-bold opacity-60 hover:opacity-100"
                onClick={() => setChargesModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={chargesLoading}
                className="flex-1 h-11 rounded-xl font-black bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                {chargesLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : editingCharge ? 'Update Charges' : 'Save Charges'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── LEDGER ENTRY MODAL (Credit / Debit) ──────────────── */}
      <Dialog open={vaultModal} onOpenChange={(open) => { setVaultModal(open); if (!open) setEditingVault(null); }}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className={`border-b p-6 ${
            vaultType === 'deposit'
              ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/10'
              : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${
                vaultType === 'deposit'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                {vaultType === 'deposit'
                  ? <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
                  : <ArrowUpCircle className="h-5 w-5 text-red-500" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">
                  {editingVault ? 'Edit Ledger Entry' : vaultType === 'deposit' ? 'New Credit Entry' : 'New Debit Entry'}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  {vaultType === 'deposit' ? 'Cr — Funds credited to ledger' : 'Dr — Funds debited from ledger'}
                </DialogDescription>
              </div>
            </div>
            {/* Type toggle — only for new entries */}
            {!editingVault && (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setVaultType('deposit')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    vaultType === 'deposit' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >Cr — Credit</button>
                <button
                  type="button"
                  onClick={() => setVaultType('withdrawal')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    vaultType === 'withdrawal' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >Dr — Debit</button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleVaultSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (₹)</label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${
                  vaultType === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                }`}>₹</span>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={vaultAmount}
                  onChange={e => setVaultAmount(e.target.value)}
                  className={`h-14 pl-8 rounded-xl border-2 font-black text-xl transition-all ${
                    vaultType === 'deposit'
                      ? 'border-emerald-400/20 bg-emerald-500/5 focus:border-emerald-400/50 text-emerald-700'
                      : 'border-red-400/20 bg-red-500/5 focus:border-red-400/50 text-red-700'
                  }`}
                  required autoFocus
                />
              </div>
            </div>
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  type="date" value={vaultDate}
                  onChange={e => setVaultDate(e.target.value)}
                  className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background font-bold text-sm transition-all"
                  required
                />
              </div>
              {vaultDate && (
                <p className="text-[10px] text-muted-foreground font-medium opacity-60 pl-1">
                  {format(new Date(vaultDate), 'EEEE, dd MMMM yyyy')}
                </p>
              )}
            </div>
            {/* Narration */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Narration <span className="opacity-40">(optional)</span></label>
              <Input
                placeholder={vaultType === 'deposit' ? 'e.g. Bank transfer, Monthly top-up...' : 'e.g. Funds withdrawn, Emergency...'}
                value={vaultNotes}
                onChange={e => setVaultNotes(e.target.value)}
                className="rounded-xl border-2 bg-muted/20 focus:bg-background text-sm transition-all"
              />
            </div>
            {/* Preview */}
            {vaultAmount && parseFloat(vaultAmount) > 0 && (
              <div className={`border rounded-2xl p-3 flex items-center justify-between ${
                vaultType === 'deposit' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${
                    vaultType === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                  }`}>{vaultType === 'deposit' ? 'Cr — Crediting' : 'Dr — Debiting'}</p>
                  <p className={`text-xl font-black italic ${
                    vaultType === 'deposit' ? 'text-emerald-600' : 'text-red-600'
                  }`}>{formatINR(parseFloat(vaultAmount))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">On</p>
                  <p className="text-sm font-black">{vaultDate ? format(new Date(vaultDate), 'dd MMM') : '—'}</p>
                </div>
              </div>
            )}
            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl font-bold opacity-60 hover:opacity-100" onClick={() => setVaultModal(false)}>Cancel</Button>
              <Button type="submit" disabled={vaultLoading} className={`flex-1 h-11 rounded-xl font-black text-white shadow-lg ${
                vaultType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              }`}>
                {vaultLoading ? (
                  <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</span>
                ) : editingVault ? 'Update Entry' : vaultType === 'deposit' ? 'Save Credit (Cr)' : 'Save Debit (Dr)'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── SYNC MODAL ─────────────────────────────────────── */}
      <Dialog open={syncModal} onOpenChange={setSyncModal}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-primary/10 p-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Sync Broker Trades</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Select date range for historical sync
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={syncFromDate}
                onChange={e => setSyncFromDate(e.target.value)}
                className="h-12 rounded-xl border-2 bg-muted/20 focus:bg-background font-bold text-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={syncToDate}
                onChange={e => setSyncToDate(e.target.value)}
                className="h-12 rounded-xl border-2 bg-muted/20 focus:bg-background font-bold text-sm transition-all"
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs font-medium text-muted-foreground leading-relaxed">
              <p>⚠️ <strong>Note:</strong> Existing trades with the same Broker ID will be <strong>updated</strong> with fresh data to fix any errors.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setSyncModal(false)}>Cancel</Button>
              <Button
                disabled={syncing}
                className="flex-1 h-11 rounded-xl font-black shadow-lg shadow-primary/20"
                onClick={handleSyncBroker}
              >
                {syncing ? 'Syncing...' : 'Start Sync'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Helper components ──────────────────────────────────────── */

function HeaderStatCard({ label, value, icon, subtitle, color = 'text-foreground', trend }: {
  label: string; value: string | number; icon: React.ReactNode;
  subtitle?: string; color?: string; trend?: 'bullish' | 'bearish';
}) {
  return (
    <Card className="border-2 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all">
      <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">{icon}</div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className={`text-2xl font-black ${color} tracking-tight`}>{value}</div>
        {subtitle && <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase mt-1 tracking-tighter">{subtitle}</p>}
        {trend && (
          <div className={`mt-2 flex items-center text-[10px] font-bold ${trend === 'bullish' ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`h-1.5 w-1.5 rounded-full mr-2 animate-pulse ${trend === 'bullish' ? 'bg-green-500' : 'bg-red-500'}`} />
            {trend.toUpperCase()} PERFORMANCE
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TradesTable({ trades, portfolioId, onRefresh }: { trades: Trade[]; portfolioId: number; onRefresh: () => void }) {
  const { toast } = useToast();

  const handleDelete = async (tradeId: number) => {
    if (confirm('Are you sure you want to delete this trade?')) {
      try {
        await tradesApi.delete(tradeId);
        toast({ title: 'Trade purged', description: 'Operation records removed from the vault.' });
        onRefresh();
      } catch {
        toast({ variant: 'destructive', title: 'Critical error', description: 'Sync failure during purge operation.' });
      }
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-muted-foreground opacity-20" />
        </div>
        <h3 className="text-xl font-black mb-1">No Trade Records</h3>
        <p className="text-sm text-muted-foreground font-medium max-w-[250px]">Start logging your executes to populate this command center.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/20">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14">Symbol</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14">Instruction</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right">Entry Details</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right">Exit Details</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right">Realized P&L</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-center">Outcome</TableHead>
            <TableHead className="font-black text-[11px] uppercase tracking-widest h-14 text-right">Operations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0 h-20">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tighter group-hover:text-primary transition-colors">{trade.symbol}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Asset Class</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${trade.trade_type === 'long' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {trade.trade_type === 'long' ? 'Buy / Long' : 'Sell / Short'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-sm tracking-tight">{formatINR(trade.entry_price)}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{format(new Date(trade.entry_date), 'MMM d, yyyy')}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {trade.exit_price ? (
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm tracking-tight">{formatINR(trade.exit_price)}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{format(new Date(trade.exit_date!), 'MMM d, yyyy')}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground/40 italic uppercase tracking-widest">Active session</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {trade.profit_loss !== null ? (
                  <div className="flex flex-col items-end">
                    <span className={`font-black text-sm tracking-tight ${trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.profit_loss >= 0 ? '+' : ''}{formatINR(trade.profit_loss)}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted/50 ${trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.profit_loss_percentage?.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground/40 italic uppercase tracking-widest">Calculated on exit</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${trade.status === 'open' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted text-muted-foreground'}`}>
                  {trade.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/dashboard/portfolios/${portfolioId}/trades/${trade.id}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon"
                    className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all"
                    onClick={() => handleDelete(trade.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
