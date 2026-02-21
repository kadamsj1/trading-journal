'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portfoliosApi, tradesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  Layers,
  Activity,
  ChevronRight,
  ExternalLink,
  Target,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';
import { useToast } from "@/components/ui/use-toast";

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

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
    fetchTrades();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      const response = await portfoliosApi.getById(portfolioId);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await tradesApi.getByPortfolio(portfolioId);
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');

  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
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
      {/* Dynamic Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl h-12 w-12 border bg-card hover:bg-muted"
            onClick={() => router.push('/dashboard/portfolios')}
          >
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
          <Link href={`/dashboard/portfolios/${portfolioId}/trades/new`}>
            <Button className="h-12 px-6 rounded-2xl font-bold gap-2">
              <Plus className="h-5 w-5" />
              Execute Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <HeaderStatCard
          label="Initial Capital"
          value={formatINR(portfolio?.initial_balance || 0)}
          icon={<History className="h-4 w-4" />}
        />
        <HeaderStatCard
          label="Closed P&L"
          value={formatINR(totalPL)}
          icon={totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          color={totalPL >= 0 ? 'text-green-600' : 'text-red-600'}
          trend={totalPL >= 0 ? 'bullish' : 'bearish'}
        />
        <HeaderStatCard
          label="Win Ratio"
          value={`${winRate.toFixed(1)}%`}
          icon={<Target className="h-4 w-4" />}
          subtitle={`${winningTrades}W / ${losingTrades}L`}
        />
        <HeaderStatCard
          label="Terminal Status"
          value={trades.length}
          icon={<Activity className="h-4 w-4" />}
          subtitle={`${openTrades.length} Active / ${closedTrades.length} Logged`}
        />
      </div>

      {/* Main Content Sections */}
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-card to-background">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl grid grid-cols-3 md:w-[450px]">
              <TabsTrigger value="all" className="rounded-xl font-bold">All Orders</TabsTrigger>
              <TabsTrigger value="open" className="rounded-xl font-bold">Open Active</TabsTrigger>
              <TabsTrigger value="closed" className="rounded-xl font-bold">History Log</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1.5 rounded-full">Automated sync</span>
            </div>
          </div>

          <div className="p-4 md:p-8">
            <TabsContent value="all" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={trades} portfolioId={portfolioId} onRefresh={fetchTrades} />
            </TabsContent>
            <TabsContent value="open" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={openTrades} portfolioId={portfolioId} onRefresh={fetchTrades} />
            </TabsContent>
            <TabsContent value="closed" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TradesTable trades={closedTrades} portfolioId={portfolioId} onRefresh={fetchTrades} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function HeaderStatCard({ label, value, icon, subtitle, color = 'text-foreground', trend }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
  trend?: 'bullish' | 'bearish';
}) {
  return (
    <Card className="border-2 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all">
      <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors`}>{icon}</div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className={`text-2xl font-black ${color} tracking-tight`}>{value}</div>
        {subtitle && (
          <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase mt-1 tracking-tighter">{subtitle}</p>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-[10px] font-bold ${trend === 'bullish' ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`h-1.5 w-1.5 rounded-full mr-2 animate-pulse ${trend === 'bullish' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {trend.toUpperCase()} PERFORMANCE
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TradesTable({ trades, portfolioId, onRefresh }: { trades: Trade[]; portfolioId: number; onRefresh: () => void }) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (tradeId: number) => {
    if (confirm('Are you sure you want to delete this trade?')) {
      try {
        await tradesApi.delete(tradeId);
        toast({
          title: "Trade purged",
          description: "Operation records removed from the vault successfully.",
        })
        onRefresh();
      } catch (error) {
        console.error('Failed to delete trade:', error);
        toast({
          variant: "destructive",
          title: "Critical error",
          description: "Sync failure during purge operation. Please try again.",
        })
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
        <p className="text-sm text-muted-foreground font-medium max-w-[250px]">
          Start logging your executes to populate this command center.
        </p>
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    {format(new Date(trade.entry_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {trade.exit_price ? (
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm tracking-tight">{formatINR(trade.exit_price)}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                      {format(new Date(trade.exit_date!), 'MMM d, yyyy')}
                    </span>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all"
                    onClick={() => handleDelete(trade.id)}
                  >
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
