'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portfoliosApi, analyticsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Activity,
  History
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  initial_balance: number;
}

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await portfoliosApi.getAll();
      setPortfolios(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Synchronizing Command Center" />;
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-card rounded-[2.5rem] border shadow-xl p-8 md:p-12">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 bg-primary/10 blur-[100px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-green-500/20 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live Terminal
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              Welcome to the <br />
              <span className="text-primary italic">Trading Vault.</span>
            </h1>
            <p className="text-lg font-bold text-muted-foreground max-w-lg leading-relaxed">
              Manage your capital across multiple strategies with professional-grade analysis and AI-driven behavioral insights.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/dashboard/portfolios/new">
                <Button className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.05] transition-transform">
                  <Plus className="mr-2 h-6 w-6" /> Deploy New Vault
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold border-2 hover:bg-muted">
                  Performance Insights
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-[400px]">
            <HeaderStat icon={<Layers className="h-5 w-5" />} label="Active Vaults" value={portfolios.length} />
            <HeaderStat icon={<Target className="h-5 w-5" />} label="Market Segments" value="Global" />
            <HeaderStat icon={<Activity className="h-5 w-5" />} label="Daily Sync" value="Verified" color="text-green-500" />
            <HeaderStat icon={<ShieldCheck className="h-5 w-5" />} label="Data Integrity" value="100%" color="text-primary" />
          </div>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {/* Main Portfolios Feed */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black tracking-tight">Active Strategy Vaults</h2>
            <Link href="/dashboard/portfolios" className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
              View Management Console <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {portfolios.length === 0 ? (
            <Card className="border-2 border-dashed bg-muted/5 rounded-[2rem]">
              <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                <FolderKanban className="h-16 w-16 text-muted-foreground opacity-20 mb-6" />
                <h3 className="text-xl font-black mb-2 leading-tight">No Active Vaults</h3>
                <p className="text-muted-foreground max-w-[250px] font-medium text-sm mb-8">
                  Initialization required. Launch your first portfolio to start the analysis engine.
                </p>
                <Link href="/dashboard/portfolios/new">
                  <Button className="rounded-2xl font-black px-8">Launch Vault v1.0</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {portfolios.map((portfolio) => (
                <Link key={portfolio.id} href={`/dashboard/portfolios/${portfolio.id}`} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-[2rem] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
                  <Card className="relative overflow-hidden border-2 border-transparent bg-card group-hover:border-primary/20 transition-all rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-2xl">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                        <Zap className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{portfolio.name}</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1 line-clamp-1 max-w-[200px]">
                          {portfolio.description || 'Active Strategy Vault'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Current Equity</p>
                        <p className="text-xl font-black">{formatINR(portfolio.initial_balance)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Recent Activity / Meta Info */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6 border-b">
              <CardTitle className="text-lg font-black flex items-center gap-3 italic">
                <History className="h-5 w-5 text-primary" /> Recent Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <ActivityItem title="Trading Vault System" desc="System fully operational" date="Active now" />
                <ActivityItem title="Portfolio Sync" desc="All data feeds verified" date="2m ago" />
                <ActivityItem title="AI Engine" desc="Pattern recognition ready" date="Stable" />
              </div>
              <Button variant="ghost" className="w-full mt-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                View Audit Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-primary p-8 text-white relative overflow-hidden group">
            <Zap className="absolute -right-6 -bottom-6 h-48 w-48 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <ArrowUpRight className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black leading-tight italic">Upgrade to <br />SmartJournal Pro</h3>
                <p className="text-xs font-bold opacity-80 leading-relaxed uppercase tracking-wider">
                  Unlock real-time broker sync, advanced risk modeling, and deeper team collaboration features.
                </p>
              </div>
              <Button className="w-full h-14 bg-white text-primary font-black text-lg rounded-2xl hover:scale-105 transition-transform">
                Unlock Terminal Plus
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ icon, label, value, color = 'text-foreground' }: { icon: React.ReactNode, label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-card/50 border rounded-2xl p-4 flex flex-col gap-2">
      <div className="p-1.5 rounded-lg bg-primary/5 text-primary w-fit">{icon}</div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">{label}</p>
        <p className={cn("text-xl font-black leading-none", color)}>{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({ title, desc, date }: { title: string, desc: string, date: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="relative flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10 relative z-10" />
        <div className="w-[2px] h-full bg-muted group-last:bg-transparent absolute top-3" />
      </div>
      <div className="space-y-1 pb-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-tight">{title}</p>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{date}</span>
        </div>
        <p className="text-xs font-medium text-muted-foreground leading-none">{desc}</p>
      </div>
    </div>
  );
}
