'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portfoliosApi, tradesApi, chargesApi } from '@/lib/api';
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

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [charges, setCharges] = useState<DailyCharge[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [chargesModal, setChargesModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<DailyCharge | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargeNotes, setChargeNotes] = useState('');
  const [chargesLoading, setChargesLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [portfolioId]);

  const fetchAll = async () => {
    try {
      const [portRes, tradeRes, chargeRes] = await Promise.all([
        portfoliosApi.getById(portfolioId),
        tradesApi.getByPortfolio(portfolioId),
        chargesApi.getByPortfolio(portfolioId),
      ]);
      setPortfolio(portRes.data);
      setTrades(tradeRes.data);
      setCharges(chargeRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
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
      const msg = err?.response?.data?.detail || 'Could not save charges.';
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

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0).length;
  const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) <= 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

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
          <Link href={`/dashboard/portfolios/${portfolioId}/trades/new`}>
            <Button className="h-12 px-6 rounded-2xl font-bold gap-2">
              <Plus className="h-5 w-5" />
              Execute Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <HeaderStatCard label="Initial Capital" value={formatINR(portfolio?.initial_balance || 0)} icon={<History className="h-4 w-4" />} />
        <HeaderStatCard label="Closed P&L" value={formatINR(totalPL)}
          icon={totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          color={totalPL >= 0 ? 'text-green-600' : 'text-red-600'} trend={totalPL >= 0 ? 'bullish' : 'bearish'} />
        <HeaderStatCard label="Win Ratio" value={`${winRate.toFixed(1)}%`}
          icon={<Target className="h-4 w-4" />} subtitle={`${winningTrades}W / ${losingTrades}L`} />
        <HeaderStatCard label="Total Charges" value={formatINR(totalCharges)}
          icon={<Receipt className="h-4 w-4" />} color="text-orange-500" subtitle={`${charges.length} day entries`} />
      </div>

      {/* Tabs */}
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-card to-background">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl grid grid-cols-4 md:w-[560px]">
              <TabsTrigger value="all" className="rounded-xl font-bold">All Orders</TabsTrigger>
              <TabsTrigger value="open" className="rounded-xl font-bold">Open Active</TabsTrigger>
              <TabsTrigger value="closed" className="rounded-xl font-bold">History Log</TabsTrigger>
              <TabsTrigger value="charges" className="rounded-xl font-bold" >Charges</TabsTrigger>
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
          </div>
        </Tabs>
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
