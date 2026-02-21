'use client';

import { useEffect, useState } from 'react';
import { portfoliosApi, analyticsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatINR } from '@/lib/currency';
import { TradingCalendar } from '@/components/trading-calendar';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ShieldCheck,
  CalendarDays,
  Trophy,
  TrendingDown as TrendingDownIcon
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';

interface Portfolio {
  id: number;
  name: string;
}

interface DailyPL {
  date: string;
  profit_loss: number;
  trade_count: number;
}

interface Analytics {
  portfolio_id: number;
  portfolio_name: string;
  total_trades: number;
  total_profit_loss: number;
  win_rate: number;
  average_profit_loss: number;
  total_wins: number;
  total_losses: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
  max_profit: number;
  min_profit: number;
  max_loss: number;
  min_loss: number;
  patterns?: {
    type: 'strength' | 'weakness';
    name: string;
    description: string;
    confidence: string;
  }[];
}

interface SymbolStat {
  symbol: string;
  total_trades: number;
  total_profit_loss: number;
  wins: number;
  losses: number;
  win_rate: number;
  win_amount: number;
  loss_amount: number;
  details?: string;
}

interface WeeklyData {
  week: string;
  label: string;
  profit_loss: number;
  total_profit: number;
  total_loss: number;
  charges: number;
  net_profit_loss: number;
  trade_count: number;
  wins: number;
  losses: number;
  win_rate: number;
  best_trade: number;
  worst_trade: number;
}

export default function AnalyticsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [symbolStats, setSymbolStats] = useState<SymbolStat[]>([]);
  const [dailyPL, setDailyPL] = useState<DailyPL[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pieView, setPieView] = useState<'outcome' | 'symbol'>('outcome');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchAnalytics(selectedPortfolio);
      fetchSymbolStats(selectedPortfolio);
      fetchDailyPL(selectedPortfolio);
      fetchWeeklyPerformance(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await portfoliosApi.getAll();
      const portfolioData = response.data;
      setPortfolios(portfolioData);
      if (portfolioData.length > 0) {
        setSelectedPortfolio(portfolioData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getPortfolioAnalytics(portfolioId);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchSymbolStats = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getBySymbol(portfolioId);
      setSymbolStats(response.data.symbols);
    } catch (error) {
      console.error('Failed to fetch symbol stats:', error);
    }
  };

  const fetchDailyPL = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getDailyPL(portfolioId);
      setDailyPL(response.data.daily_pl);
    } catch (error) {
      console.error('Failed to fetch daily PL:', error);
    }
  };

  const fetchWeeklyPerformance = async (portfolioId: number) => {
    try {
      const response = await analyticsApi.getWeeklyPerformance(portfolioId);
      setWeeklyData(response.data.weekly);
    } catch (error) {
      console.error('Failed to fetch weekly performance:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Analyzing your data" />;
  }

  if (portfolios.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-black tracking-tight uppercase italic">Analytics</h1>
        <Card className="border-dashed bg-muted/5 rounded-[2.5rem]">
          <CardContent className="flex flex-col items-center justify-center p-20">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-muted-foreground opacity-30" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Portfolios Found</h2>
            <p className="text-muted-foreground text-center max-w-xs text-sm font-medium">Create a portfolio to start tracking your performance and unlock insights.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winLossData = analytics
    ? [
      { name: 'Wins', value: analytics.total_wins, color: '#10b981' },
      { name: 'Losses', value: analytics.total_losses, color: '#ef4444' },
    ]
    : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-8 rounded-[2rem] border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter italic">
            Insight <span className="text-primary">Terminal</span>
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-green-500 fill-green-500/20" />
            Live Data Feed for {analytics?.portfolio_name || 'Portfolio'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <select
              value={selectedPortfolio || ''}
              onChange={(e) => setSelectedPortfolio(parseInt(e.target.value))}
              className="relative flex h-12 w-full sm:w-[240px] items-center justify-between rounded-xl border-2 border-primary/10 bg-card px-4 py-2 text-sm font-black italic tracking-tight shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
            >
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {analytics && (
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/40 p-1.5 h-16 rounded-[1.5rem] grid grid-cols-4 md:w-[700px] border shadow-inner">
            <TabsTrigger value="overview" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Overview</TabsTrigger>
            <TabsTrigger value="behavior" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Behavior</TabsTrigger>
            <TabsTrigger value="symbols" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Symbols</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Weekly</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-6 md:grid-cols-4">
              <StatCard
                title="Cumulative P&L"
                value={formatINR(analytics.total_profit_loss)}
                icon={<Activity className="h-4 w-4" />}
                trend={analytics.total_profit_loss >= 0 ? 'up' : 'down'}
                color={analytics.total_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}
              />
              <StatCard
                title="Win Probability"
                value={`${analytics.win_rate.toFixed(1)}%`}
                icon={<Target className="h-4 w-4" />}
                subtitle={`${analytics.total_wins} Wins / ${analytics.total_losses} Losses`}
              />
              <StatCard
                title="Average Trade"
                value={formatINR(analytics.average_profit_loss)}
                icon={<TrendingUp className="h-4 w-4" />}
                color={analytics.average_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}
              />
              <StatCard
                title="Profit Factor"
                value={analytics.profit_factor.toFixed(2)}
                icon={<Zap className="h-4 w-4" />}
                subtitle={analytics.profit_factor >= 1 ? 'Efficiency: High' : 'Efficiency: Low'}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* OUTCOME DISTRIBUTION — By Outcome / By Symbol toggle */}
              <Card className="md:col-span-2 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl">
                <CardHeader className="border-b bg-muted/20 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <PieChartIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black italic tracking-tight">Outcome Distribution</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Success ratio visualization</CardDescription>
                      </div>
                    </div>
                    {/* Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border">
                      {(['outcome', 'symbol'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPieView(mode)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200',
                            pieView === mode
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {mode === 'outcome' ? 'By Outcome' : 'By Symbol'}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 flex items-center justify-center overflow-hidden">
                  <div className="h-[350px] w-full max-w-[520px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        {pieView === 'outcome' ? (
                          /* ── By Outcome: Wins vs Losses ── */
                          <Pie
                            data={winLossData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={130}
                            paddingAngle={8}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(1)}%`
                            }
                            labelLine={false}
                          >
                            {winLossData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                strokeWidth={0}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            ))}
                          </Pie>
                        ) : (
                          /* ── By Symbol: P&L per symbol ── */
                          <Pie
                            data={(() => {
                              const SYMBOL_COLORS = [
                                '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
                                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
                              ];
                              return symbolStats.map((s, i) => ({
                                name: s.symbol,
                                value: Math.abs(s.total_profit_loss),
                                rawPL: s.total_profit_loss,
                                color: s.total_profit_loss >= 0
                                  ? SYMBOL_COLORS[i % SYMBOL_COLORS.length]
                                  : '#ef4444',
                              }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={130}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              percent > 0.04 ? `${name} ${(percent * 100).toFixed(1)}%` : ''
                            }
                            labelLine
                          >
                            {symbolStats.map((s, i) => {
                              const SYMBOL_COLORS = [
                                '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
                                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
                              ];
                              return (
                                <Cell
                                  key={`sym-${i}`}
                                  fill={s.total_profit_loss >= 0
                                    ? SYMBOL_COLORS[i % SYMBOL_COLORS.length]
                                    : '#ef4444'}
                                  strokeWidth={0}
                                  opacity={s.total_profit_loss >= 0 ? 1 : 0.7}
                                  className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              );
                            })}
                          </Pie>
                        )}
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px' }}
                          formatter={(value: number, name: string, props: any) => {
                            if (pieView === 'symbol') {
                              const rawPL = props?.payload?.rawPL ?? value;
                              return [formatINR(rawPL), name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-6 text-center">
                  <CardTitle className="text-xl font-black italic tracking-tight uppercase">Core Intelligence</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Risk/Reward Metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-8">
                  <MetricRow label="Trade Volume" value={analytics.total_trades} />
                  <MetricRow label="Avg winning" value={formatINR(analytics.average_win)} color="text-green-500" />
                  <MetricRow label="Avg Losing" value={formatINR(analytics.average_loss)} color="text-red-500" />
                  <MetricRow
                    label="R/R Ratio"
                    value={analytics.average_loss !== 0 ? (Math.abs(analytics.average_win / analytics.average_loss)).toFixed(2) : 'N/A'}
                  />

                  <div className="pt-6 border-t space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 text-center opacity-40">Extremes Feed</p>
                    <MetricRow label="Largest Gain" value={formatINR(analytics.max_profit)} color="text-green-500 font-black" />
                    <MetricRow label="Largest Loss" value={formatINR(analytics.max_loss)} color="text-red-500 font-black" />
                    <MetricRow label="Small Gain" value={formatINR(analytics.min_profit)} color="text-green-500/70" />
                    <MetricRow label="Small Loss" value={formatINR(analytics.min_loss)} color="text-red-500/70" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-8">
              <TradingCalendar dailyPL={dailyPL} />

              <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-950 to-background border-t border-t-white/10">
                <CardHeader className="bg-white/5 backdrop-blur-md pb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-indigo-400/30">
                      <BrainCircuit className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">Behavior Analysis</CardTitle>
                      <CardDescription className="text-indigo-200/60 text-[10px] font-black uppercase tracking-[0.2em]">AI-Derived Pattern Recognition</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {analytics.patterns && analytics.patterns.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {analytics.patterns.map((pattern, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-8 rounded-[2rem] border-2 transition-all hover:scale-[1.02] shadow-xl",
                            pattern.type === 'strength'
                              ? 'bg-green-500/5 border-green-500/20 text-green-100'
                              : 'bg-red-500/5 border-red-500/20 text-red-100'
                          )}
                        >
                          <div className="flex items-start justify-between mb-6">
                            <h4 className={cn(
                              "text-xl font-black italic tracking-tight",
                              pattern.type === 'strength' ? 'text-green-400' : 'text-red-400'
                            )}>
                              {pattern.name}
                            </h4>
                            <span className={cn(
                              "text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border backdrop-blur-md",
                              pattern.type === 'strength' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
                            )}>
                              {pattern.confidence} Confidence
                            </span>
                          </div>
                          <p className="text-sm font-bold leading-relaxed opacity-70 italic">"{pattern.description}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                      <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border-dashed border-2 border-white/20">
                        <Activity className="h-10 w-10 text-white opacity-20" />
                      </div>
                      <p className="text-center text-indigo-200/40 text-xs font-black uppercase tracking-widest max-w-[300px]">
                        Analyzing data streams... <br />More trade samples required for behavioral mapping.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {symbolStats.length > 0 ? (
              <div className="space-y-8">
                <Card className="border-none shadow-2xl p-6 overflow-hidden rounded-[2.5rem]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-black italic tracking-tight">Segment Exposure</CardTitle>
                          <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            Capital distribution across market assets · Profit% vs Loss%
                          </CardDescription>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-5 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                          Profit Trades
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />
                          Loss Trades
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[420px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={symbolStats}
                        barCategoryGap="30%"
                        barGap={4}
                        margin={{ top: 28, right: 16, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis
                          dataKey="symbol"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontWeight: 900, fontSize: 10, fill: 'currentColor' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontWeight: 700, fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
                          width={42}
                          tickFormatter={(v) =>
                            v >= 100000
                              ? `₹${(v / 100000).toFixed(1)}L`
                              : v >= 1000
                                ? `₹${(v / 1000).toFixed(1)}k`
                                : `₹${v}`
                          }
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'currentColor', opacity: 0.04 }}
                          content={({ active, payload, label }: any) => {
                            if (!active || !payload?.length) return null;
                            const stat = symbolStats.find(s => s.symbol === label);
                            if (!stat) return null;
                            const lossRate = stat.total_trades > 0
                              ? ((stat.losses / stat.total_trades) * 100).toFixed(1)
                              : '0';
                            return (
                              <div className="bg-background rounded-[18px] shadow-2xl p-4 border border-border min-w-[220px]">
                                <p className="text-sm font-black uppercase tracking-widest mb-3">{label}</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-[11px] font-black text-emerald-500">✅ Profit Trades</span>
                                    <span className="font-black text-sm">{stat.wins} <span className="text-emerald-500">({stat.win_rate}%)</span></span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-[11px] font-black text-emerald-400">💰 Profit Amt</span>
                                    <span className="font-black text-sm text-emerald-500">{formatINR(stat.win_amount)}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-[11px] font-black text-red-500">❌ Loss Trades</span>
                                    <span className="font-black text-sm">{stat.losses} <span className="text-red-500">({lossRate}%)</span></span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-[11px] font-black text-red-400">🩸 Loss Amt</span>
                                    <span className="font-black text-sm text-red-500">{formatINR(stat.loss_amount)}</span>
                                  </div>
                                  <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                                    <span className="text-[11px] font-bold opacity-60 uppercase tracking-widest">Net P&L</span>
                                    <span className={`font-black text-base ${stat.total_profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {formatINR(stat.total_profit_loss)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        {/* Profit amount — green bar with ₹ label on top */}
                        <Bar dataKey="win_amount" name="Profit Amount" radius={[8, 8, 0, 0]} barSize={28}
                          label={{
                            position: 'top',
                            content: (props: any) => {
                              const stat = symbolStats[props.index];
                              if (!stat || stat.win_amount === 0) return null;
                              // compact format: ₹12.4k or ₹1.2L
                              const v = stat.win_amount;
                              const display = v >= 100000
                                ? `₹${(v / 100000).toFixed(1)}L`
                                : v >= 1000
                                  ? `₹${(v / 1000).toFixed(1)}k`
                                  : `₹${v.toFixed(0)}`;
                              return (
                                <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle"
                                  fill="#10b981" fontSize={10} fontWeight={900}>
                                  {display}
                                </text>
                              );
                            }
                          }}
                        >
                          {symbolStats.map((entry, i) => (
                            <Cell key={`win-${i}`} fill="#10b981" opacity={entry.win_rate >= 50 ? 1 : 0.55} />
                          ))}
                        </Bar>
                        {/* Loss amount — red bar with ₹ label on top */}
                        <Bar dataKey="loss_amount" name="Loss Amount" radius={[8, 8, 0, 0]} barSize={28}
                          label={{
                            position: 'top',
                            content: (props: any) => {
                              const stat = symbolStats[props.index];
                              if (!stat || stat.loss_amount === 0) return null;
                              const v = stat.loss_amount;
                              const display = v >= 100000
                                ? `₹${(v / 100000).toFixed(1)}L`
                                : v >= 1000
                                  ? `₹${(v / 1000).toFixed(1)}k`
                                  : `₹${v.toFixed(0)}`;
                              return (
                                <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle"
                                  fill="#ef4444" fontSize={10} fontWeight={900}>
                                  {display}
                                </text>
                              );
                            }
                          }}
                        >
                          {symbolStats.map((entry, i) => (
                            <Cell key={`loss-${i}`} fill="#ef4444" opacity={entry.win_rate < 50 ? 1 : 0.55} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
                  <CardHeader className="bg-muted/30 border-b pb-6 p-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Symbol Intelligence</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Aggregated performance list</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/10">
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trades</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Win Rate</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net P&L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {symbolStats.map((stat, index) => (
                            <tr key={index} className="group hover:bg-muted/20 transition-all duration-300">
                              <td className="px-8 py-6">
                                <div className="space-y-1">
                                  <p className="text-xl font-black tracking-tighter italic group-hover:text-primary transition-colors uppercase">{stat.symbol}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground opacity-50 truncate max-w-[250px]">{stat.details || 'Base Asset Trading'}</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-card border shadow-sm font-black text-sm">
                                  {stat.total_trades}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="space-y-2">
                                  <div className="h-1.5 w-24 bg-muted rounded-full mx-auto overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        stat.win_rate >= 50 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                      )}
                                      style={{ width: `${stat.win_rate}%` }}
                                    />
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{stat.win_rate}%</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right font-black italic tracking-tighter">
                                <p className={cn(
                                  "text-2xl leading-none",
                                  stat.total_profit_loss >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {formatINR(stat.total_profit_loss)}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed bg-muted/5 rounded-[2.5rem]">
                <CardContent className="flex flex-col items-center justify-center p-24 text-center">
                  <Activity className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Symbol Data Found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─────────────── WEEKLY PERFORMANCE ─────────────── */}
          <TabsContent value="weekly" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {weeklyData.length > 0 ? (
              <div className="space-y-8">
                {/* Weekly P&L Chart */}
                <Card className="border-none shadow-2xl rounded-[2.5rem] p-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-black italic tracking-tight">Weekly P&amp;L Chart</CardTitle>
                          <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            Gross P&amp;L · Net P&amp;L · Charges — per trading week
                          </CardDescription>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="hidden md:flex items-center gap-5 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
                          Gross P&amp;L
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                          Net P&amp;L
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" />
                          Charges
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[380px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyData}
                        barCategoryGap="28%"
                        barGap={3}
                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontWeight: 900, fontSize: 10, fill: 'currentColor' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontWeight: 700, fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                          width={52}
                        />
                        <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1.5} />
                        <RechartsTooltip
                          cursor={{ fill: 'currentColor', opacity: 0.04 }}
                          contentStyle={{
                            borderRadius: '18px',
                            border: 'none',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                            padding: '14px 18px',
                            fontSize: '12px',
                            fontWeight: 800,
                          }}
                          formatter={(value: number, name: string) => {
                            const labels: Record<string, string> = {
                              profit_loss: '📊 Gross P&L',
                              net_profit_loss: '✅ Net P&L',
                              charges: '🧾 Charges',
                            };
                            return [formatINR(value), labels[name] || name];
                          }}
                          labelStyle={{ fontWeight: 900, fontSize: 11, marginBottom: 6, opacity: 0.7 }}
                        />
                        {/* Gross P&L — blue */}
                        <Bar dataKey="profit_loss" name="profit_loss" radius={[6, 6, 0, 0]} barSize={22}>
                          {weeklyData.map((entry, i) => (
                            <Cell
                              key={`gross-${i}`}
                              fill={entry.profit_loss >= 0 ? '#3b82f6' : '#93c5fd'}
                              opacity={0.85}
                            />
                          ))}
                        </Bar>
                        {/* Net P&L — green/red */}
                        <Bar dataKey="net_profit_loss" name="net_profit_loss" radius={[6, 6, 0, 0]} barSize={22}>
                          {weeklyData.map((entry, i) => (
                            <Cell
                              key={`net-${i}`}
                              fill={entry.net_profit_loss >= 0 ? '#10b981' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                        {/* Charges — always orange */}
                        <Bar dataKey="charges" name="charges" radius={[6, 6, 0, 0]} barSize={22} fill="#f97316" opacity={0.75} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Detail table */}
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
                  <CardHeader className="bg-muted/30 border-b pb-6 p-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Weekly Tracker</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Week-by-week performance breakdown</CardDescription>
                      </div>
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-primary/20">
                        {weeklyData.length} WEEKS TRACKED
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/10">
                            <th className="px-8 py-5 text-left   text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trades</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Win Rate</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best Trade</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Worst Trade</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Profit</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-red-500">Total Loss</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Charges</th>
                            <th className="px-8 py-5 text-right  text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net P&L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {weeklyData.map((week, index) => (
                            <tr key={index} className="group hover:bg-muted/20 transition-all duration-300">
                              <td className="px-8 py-6">
                                <div className="space-y-0.5">
                                  <p className="text-base font-black italic tracking-tight group-hover:text-primary transition-colors">{week.label}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">{week.week}</p>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-card border shadow-sm font-black text-sm">{week.trade_count}</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{week.wins}W / {week.losses}L</span>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <div className="space-y-1.5">
                                  <div className="h-1.5 w-20 bg-muted rounded-full mx-auto overflow-hidden">
                                    <div
                                      className={cn('h-full rounded-full transition-all duration-1000', week.win_rate >= 50 ? 'bg-green-500' : 'bg-red-500')}
                                      style={{ width: `${week.win_rate}%` }}
                                    />
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{week.win_rate}%</p>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <span className="text-sm font-black text-green-500 italic">{formatINR(week.best_trade)}</span>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <span className="text-sm font-black text-red-500 italic">{formatINR(week.worst_trade)}</span>
                              </td>
                              {/* Total Profit */}
                              <td className="px-6 py-6 text-center">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-black text-emerald-500 italic">{formatINR(week.total_profit)}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{week.wins}W</p>
                                </div>
                              </td>
                              {/* Total Loss */}
                              <td className="px-6 py-6 text-center">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-black text-red-500 italic">{formatINR(-week.total_loss)}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{week.losses}L</p>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-black text-orange-500 italic">{formatINR(week.charges)}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Broker+Tax</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-muted-foreground line-through opacity-50">{formatINR(week.profit_loss)}</p>
                                  <p className={cn('text-2xl font-black italic leading-none tracking-tighter', week.net_profit_loss >= 0 ? 'text-green-500' : 'text-red-500')}>
                                    {formatINR(week.net_profit_loss)}
                                  </p>
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', week.net_profit_loss >= 0 ? 'bg-green-500' : 'bg-red-500')} />
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30">After Charges</p>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 bg-muted/10">
                          <tr>
                            <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground" colSpan={5}>All-Time Cumulative</td>
                            <td className="px-6 py-5 text-center text-sm font-black italic text-emerald-500">
                              {formatINR(weeklyData.reduce((sum, w) => sum + (w.total_profit ?? 0), 0))}
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-black italic text-red-500">
                              {formatINR(-(weeklyData.reduce((sum, w) => sum + (w.total_loss ?? 0), 0)))}
                            </td>
                            <td className="px-6 py-5 text-center text-sm font-black italic text-orange-500">
                              {formatINR(weeklyData.reduce((sum, w) => sum + w.charges, 0))}
                            </td>
                            <td className={cn('px-8 py-5 text-right text-2xl font-black italic tracking-tighter',
                              weeklyData.reduce((sum, w) => sum + w.net_profit_loss, 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            )}>
                              {formatINR(weeklyData.reduce((sum, w) => sum + w.net_profit_loss, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed bg-muted/5 rounded-[2.5rem]">
                <CardContent className="flex flex-col items-center justify-center p-24 text-center">
                  <CalendarDays className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">No Weekly Data</h3>
                  <p className="text-muted-foreground text-[11px] font-black uppercase tracking-widest max-w-[260px] opacity-60">
                    Close trades to start tracking your weekly performance.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color = 'text-foreground', subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color?: string;
  subtitle?: string;
}) {
  return (
    <Card className="relative overflow-hidden group border-2 hover:border-primary/20 transition-all duration-300 rounded-2xl shadow-sm">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500`}>
        {icon}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">{icon}</span>
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className={`text-2xl font-black ${color} tracking-tight italic`}>
            {value}
          </div>
          {trend && (
            <div className={`flex items-center text-[9px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trend === 'up' ? 'Increase' : 'Decrease'}
            </div>
          )}
          {subtitle && (
            <p className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, color = 'text-foreground', bold = false }: {
  label: string;
  value: string | number;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 group-hover:text-foreground transition-colors">{label}:</span>
      <span className={`text-lg italic tracking-tighter ${bold ? 'font-black' : 'font-black'} ${color}`}>{value}</span>
    </div>
  );
}
