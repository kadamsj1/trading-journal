'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { portfoliosApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Wallet,
  ShieldPlus,
  Rocket,
  Info
} from 'lucide-react';

export default function NewPortfolioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initial_balance: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await portfoliosApi.create({
        name: formData.name,
        description: formData.description || undefined,
        initial_balance: parseFloat(formData.initial_balance) || 0,
      });
      router.push('/dashboard/portfolios');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else {
        setError('Failed to initialize vault. Technical failure.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl h-14 w-14 border bg-card shadow-sm hover:scale-110 transition-transform"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Initialize <span className="text-primary italic">Strategy Vault</span></h1>
          <p className="text-muted-foreground font-medium">Create a dedicated environment for your specific trading system.</p>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-5 items-start">
        {/* Helper Instructions Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-primary/5 p-6 rounded-[2rem]">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-black mb-2 leading-tight">Segment Your Assets</h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Best practice is to separate your **Intraday**, **Swing**, and **Long-term** holdings into different vaults for accurate performance attribution.
            </p>
          </Card>

          <div className="px-4 space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black">01</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase py-2">Set clear objectives</p>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black">02</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase py-2">Allocate discrete capital</p>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black">03</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase py-2">Track risk-adjusted returns</p>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <Card className="md:col-span-3 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <ShieldPlus className="h-6 w-6 text-primary" />
              Configuration Settings
            </CardTitle>
            <CardDescription className="font-medium">Define the core identity of this portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/5 border-2 border-red-500/20 rounded-2xl animate-pulse">
                  Error: {error}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  Vault Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., QUANTUM_ALPHA_VAULT"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-black text-lg px-6"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="initial_balance" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  Initial Allocation <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-muted-foreground/50">INR</div>
                  <Input
                    id="initial_balance"
                    name="initial_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.initial_balance}
                    onChange={handleChange}
                    className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-black text-xl pl-16 pr-6"
                    required
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                  <Info className="h-3 w-3" /> This is used to calculate percentage drawdown.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Strategy Mandate
                </Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Define the primary strategy, constraints, and risk parameters for this vault..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[120px] w-full rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-medium text-sm p-6 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 flex-1 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                >
                  {loading ? 'Initializing...' : 'Deploy Strategy Vault'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-14 px-8 rounded-2xl font-bold border-2 hover:bg-muted"
                >
                  Discard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
