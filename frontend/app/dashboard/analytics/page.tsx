'use client';

import { useEffect, useState } from 'react';
import { portfoliosApi, analyticsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
  ShieldCheck
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
  details?: string;
}

export default function AnalyticsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [symbolStats, setSymbolStats] = useState<SymbolStat[]>([]);
  const [dailyPL, setDailyPL] = useState<DailyPL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchAnalytics(selectedPortfolio);
      fetchSymbolStats(selectedPortfolio);
      fetchDailyPL(selectedPortfolio);
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
          <TabsList className="bg-muted/40 p-1.5 h-16 rounded-[1.5rem] grid grid-cols-3 md:w-[500px] border shadow-inner">
            <TabsTrigger value="overview" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Overview</TabsTrigger>
            <TabsTrigger value="behavior" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Behavior</TabsTrigger>
            <TabsTrigger value="symbols" className="rounded-xl font-black italic tracking-tighter uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl transition-all">Symbols</TabsTrigger>
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
              <Card className="md:col-span-2 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl">
                <CardHeader className="border-b bg-muted/20 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <PieChartIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black italic tracking-tight">Outcome Distribution</CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Success ratio visualization</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 flex items-center justify-center overflow-hidden">
                  <div className="h-[350px] w-full max-w-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={8}
                          dataKey="value"
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
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }} />
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
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black italic tracking-tight">Segment Exposure</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Capital distribution across market assets</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[400px] pt-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={symbolStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fontWeight: 'black', fontSize: 10, fill: 'currentColor' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} hide />
                        <RechartsTooltip
                          cursor={{ fill: 'currentColor', opacity: 0.05 }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px' }}
                        />
                        <Bar
                          dataKey="total_profit_loss"
                          fill="currentColor"
                          radius={[12, 12, 0, 0]}
                          barSize={60}
                        >
                          {symbolStats.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.total_profit_loss >= 0 ? '#10b981' : '#ef4444'}
                              className="hover:opacity-80 transition-opacity"
                            />
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
