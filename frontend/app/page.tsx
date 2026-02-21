'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Zap,
  ShieldCheck,
  Target,
  Layers,
  Cpu,
  ArrowRight,
  Globe,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Dynamic Nav */}
      <nav className="fixed top-0 w-full z-50 border-b bg-background/50 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">Smart<span className="text-primary italic">Journal</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black uppercase text-[10px] tracking-widest text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Segments</a>
            <a href="#analytics" className="hover:text-primary transition-colors">Intelligence</a>
            <a href="#security" className="hover:text-primary transition-colors">Vault</a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="font-bold">Log In</Button>
            </Link>
            <Link href="/register">
              <Button className="font-black rounded-xl h-11 px-6 shadow-xl shadow-primary/20">Launch Terminal</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section: The Command Center */}
      <section className="relative pt-40 pb-32 overflow-hidden border-b">
        {/* Background Orbs */}
        <div className="absolute top-1/4 -left-20 h-[500px] w-[500px] bg-primary/20 blur-[150px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute top-1/2 -right-20 h-[500px] w-[500px] bg-blue-600/20 blur-[150px] rounded-full opacity-30" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-10">
            <div className="inline-block animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="inline-flex items-center rounded-3xl border-2 border-primary/20 bg-primary/5 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <span className="mr-3 h-2 w-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary"></span>
                Now Live: AI-Driven Behavioral Analysis 2.0
              </div>
            </div>

            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent italic">
              THE FUTURE OF <br />
              <span className="text-primary">DISCIPLINED</span> TRADING.
            </h1>

            <p className="text-lg md:text-2xl font-bold text-muted-foreground max-w-3xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Join a new generation of Indian traders using automated journals, <br className="hidden md:block" />
              predictive analytics, and strategic vaults to achieve market mastery.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4 w-full justify-center">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all w-full sm:w-auto">
                  Start Free Execution
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-2 font-black text-xl hover:bg-muted w-full sm:w-auto">
                  Explore The Terminal
                </Button>
              </Link>
            </div>

            <div className="pt-12 flex flex-wrap justify-center gap-10 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-2 font-black italic tracking-tighter text-2xl">NSE <span className="text-primary">CORE</span></div>
              <div className="flex items-center gap-2 font-black italic tracking-tighter text-2xl">BSE <span className="text-primary">SYNC</span></div>
              <div className="flex items-center gap-2 font-black italic tracking-tighter text-2xl">MCX <span className="text-primary">LINK</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features: Bento Grid Masterclass */}
      <section id="features" className="py-32 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Large Card: AI */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-card border shadow-2xl p-10 flex flex-col justify-between min-h-[500px]">
              <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter italic leading-none">AI-INFUSED <br />ANALYSIS</h3>
                <p className="text-lg font-bold text-muted-foreground max-w-[280px]">Automated pattern recognition detects your psychological traps and strength-pockets instantly.</p>
              </div>
              <div className="relative z-10 p-6 bg-primary/5 border rounded-3xl mt-12 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-2 w-8 bg-primary rounded-full" />
                  <div className="h-2 w-4 bg-primary/20 rounded-full" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live Sync Complete</span>
              </div>
            </div>

            {/* Medium Card: Vaults */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-700 to-primary p-10 text-white flex flex-col justify-between shadow-2xl">
              <ShieldCheck className="absolute -right-10 -bottom-10 h-64 w-64 opacity-20 group-hover:rotate-12 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-3xl font-black tracking-tighter">STRATEGY VAULTS</h3>
                <p className="font-bold opacity-80 max-w-[300px]">Segment your capital across Intraday, Swing, and Long-term portfolios with ease.</p>
              </div>
              <Button variant="secondary" className="w-fit rounded-xl font-black mt-6">Initialize Vaults</Button>
            </div>

            {/* Metrics Card */}
            <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-card border p-8 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xl">
              <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black italic">METRICS</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase leading-none">Global ROI Sync</p>
              </div>
            </div>

            {/* Global Section */}
            <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-card border p-8 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xl">
              <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black italic">LOCALE EX</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase leading-none">Indian Numbering</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indian Markets: Premium Detail */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <Card className="border-none shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)] rounded-[3rem] overflow-hidden bg-card">
            <CardContent className="p-0 flex flex-col md:flex-row min-h-[600px]">
              <div className="flex-1 p-16 space-y-10 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="text-2xl font-black text-primary italic">🇮🇳 BHARAT READY</div>
                  <h2 className="text-6xl font-black tracking-tighter leading-tight italic">
                    DESIGNED FOR <br />THE INDIAN TRADER.
                  </h2>
                  <p className="text-lg font-bold text-muted-foreground leading-relaxed max-w-lg">
                    From Crores and Lakhs system support to GST-ready tracking and multi-exchange sync (NSE/BSE/MCX), we speak your language.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <MarketStat label="Currency" val="₹ INR Native" />
                  <MarketStat label="Numbering" val="Lakhs & Crores" />
                  <MarketStat label="Compliance" val="Audit Ready" />
                  <MarketStat label="Sync" val="100% Reliable" />
                </div>
              </div>
              <div className="flex-1 bg-muted relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-2xl animate-float">
                    <Activity className="h-20 w-20 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA: Final Impact */}
      <section className="py-32 border-t">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter italic leading-none">
              READY TO <span className="text-primary italic">AUGMENT</span> <br /> YOUR EDGE?
            </h2>
            <p className="text-xl font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Secure your alpha. Deploy the terminal 2.0.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <Link href="/register">
                <Button size="lg" className="h-20 px-12 rounded-[2rem] font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                  INITIALIZE FREE ACCOUNT
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-4 font-black text-2xl hover:bg-muted">
                  SIGN IN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Tech Minimalist */}
      <footer className="border-t py-16 bg-muted/10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-black tracking-tighter italic opacity-60">SmartJournal <span className="text-[10px] font-black uppercase tracking-widest ml-2">v2.0</span></span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
            <a href="#">Security</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">API</a>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">
            © 2026 SmartJournal Operations. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MarketStat({ label, val }: { label: string, val: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{label}</p>
      <p className="text-lg font-black tracking-tight">{val}</p>
    </div>
  );
}
