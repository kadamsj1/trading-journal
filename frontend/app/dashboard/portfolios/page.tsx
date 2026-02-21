'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portfoliosApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderKanban,
  Wallet,
  ArrowUpRight,
  BarChart3,
  LayoutGrid,
  Search,
  MoreVertical,
  History
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { formatINR } from '@/lib/currency';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  initial_balance: number;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPortfolios = portfolios.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <LoadingScreen message="Syncing Portfolios" />;
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Dynamic Header Information */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-background p-8 rounded-3xl border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <FolderKanban className="h-40 w-40" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Management Console</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">Your <span className="text-primary italic">Vaults</span></h1>
            <p className="text-muted-foreground font-medium max-w-md">
              You have <span className="text-foreground font-bold">{portfolios.length} active portfolios</span> under management across all trading segments.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/portfolios/new">
              <Button className="h-12 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2">
                <Plus className="h-5 w-5" />
                Create New Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vaults by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-2xl border bg-card/50 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-muted/40 p-1 rounded-xl">
          <Button variant="ghost" size="sm" className="rounded-lg h-9 bg-card">
            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
          </Button>
          <Button variant="ghost" size="sm" className="rounded-lg h-9 opacity-50 cursor-not-allowed">
            <History className="h-4 w-4 mr-2" /> Recent
          </Button>
        </div>
      </div>

      {portfolios.length === 0 ? (
        <Card className="border-2 border-dashed bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center p-24 text-center">
            <div className="h-24 w-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
              <Wallet className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-black mb-3">Initialize Your First Vault</h3>
            <p className="text-muted-foreground mb-8 max-w-sm font-medium">
              Start your disciplined trading journey by organizing your capital into dedicated portfolios.
            </p>
            <Link href="/dashboard/portfolios/new">
              <Button size="lg" className="rounded-2xl px-8 font-bold h-14 bg-primary hover:scale-105 transition-transform">
                <Plus className="mr-2 h-6 w-6" />
                Launch New Vault
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPortfolios.map((portfolio) => (
            <Link key={portfolio.id} href={`/dashboard/portfolios/${portfolio.id}`} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <Card className="relative border-2 border-transparent bg-card group-hover:border-primary/20 transition-all duration-300 rounded-[2rem] overflow-hidden group-hover:-translate-y-2 group-hover:shadow-2xl h-full flex flex-col">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                      <BarChart3 className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{portfolio.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] font-medium leading-relaxed">
                    {portfolio.description || 'Global trading portfolio with active risk management settings.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 mt-auto">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-muted flex flex-col gap-3 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Initial Equity</span>
                      <span className="text-lg font-black text-foreground">{formatINR(portfolio.initial_balance)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> READY
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-50">SYNCED 2M AGO</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Quick Add Card */}
          <Link href="/dashboard/portfolios/new" className="group">
            <Card className="border-2 border-dashed border-muted hover:border-primary/30 hover:bg-primary/5 bg-transparent transition-all duration-300 rounded-[2rem] h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="h-14 w-14 bg-muted rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
              </div>
              <h3 className="text-xl font-black mb-1 group-hover:text-primary">Add Portfolio</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Strategy Vault</p>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
