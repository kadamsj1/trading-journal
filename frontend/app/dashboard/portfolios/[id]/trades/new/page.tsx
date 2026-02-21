'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tradesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Zap,
  Target,
  Calendar,
  Tag,
  FileText,
  BadgeDollarSign,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function NewTradePage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);

  const [formData, setFormData] = useState({
    symbol: '',
    trade_type: 'long',
    entry_price: '',
    entry_date: new Date().toISOString().split('T')[0],
    quantity: '',
    notes: '',
    tags: '',
    charges: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      await tradesApi.create({
        portfolio_id: portfolioId,
        symbol: formData.symbol.toUpperCase(),
        trade_type: formData.trade_type,
        entry_price: parseFloat(formData.entry_price),
        entry_date: new Date(formData.entry_date).toISOString(),
        quantity: parseFloat(formData.quantity),
        notes: formData.notes || undefined,
        tags: formData.tags || undefined,
        charges: formData.charges ? parseFloat(formData.charges) : 0,
      });
      router.push(`/dashboard/portfolios/${portfolioId}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else {
        setError('Failed to log trade execution. Please verify inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Dynamic Header */}
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
          <h1 className="text-4xl font-black tracking-tighter">Execute <span className="text-primary italic">Trade</span></h1>
          <p className="text-muted-foreground font-medium">Record a new market operation in your strategy vault.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        {/* Main Details Card */}
        <Card className="md:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              Trade Core
            </CardTitle>
            <CardDescription className="font-medium">Primary execution parameters and identification.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="p-4 text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/5 border-2 border-red-500/20 rounded-2xl animate-pulse">
                Order Rejected: {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset Symbol</Label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    id="symbol"
                    name="symbol"
                    placeholder="e.g. RELIANCE"
                    value={formData.symbol}
                    onChange={handleChange}
                    className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background transition-all font-black text-sm uppercase"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade_type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Type</Label>
                <select
                  id="trade_type"
                  name="trade_type"
                  value={formData.trade_type}
                  onChange={handleChange}
                  className="flex h-12 w-full rounded-xl border-2 border-input bg-muted/20 px-4 py-2 text-sm font-black uppercase tracking-widest focus:bg-background outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="long">🟢 BUY / LONG</option>
                  <option value="short">🔴 SELL / SHORT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entry_price" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Price</Label>
                <div className="relative">
                  <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    id="entry_price"
                    name="entry_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.entry_price}
                    onChange={handleChange}
                    className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background transition-all font-black text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position Size</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background transition-all font-black text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Execution Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  id="entry_date"
                  name="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={handleChange}
                  className="h-12 pl-10 rounded-xl border-2 bg-muted/20 focus:bg-background transition-all font-black text-sm"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplementary Info Column */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Categorization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tags (CSV)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="breakout, swing, earnings..."
                    value={formData.tags}
                    onChange={handleChange}
                    className="rounded-xl border-2 bg-muted/20 focus:bg-background transition-all text-xs font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-orange-500/5 pb-4 border-b border-orange-500/10">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Receipt className="h-4 w-4 text-orange-500" />
                Charges
              </CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Brokerage, STT, GST, Taxes</p>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="charges" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Charges (₹)</Label>
                <div className="relative">
                  <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 opacity-60" />
                  <Input
                    id="charges"
                    name="charges"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.charges}
                    onChange={handleChange}
                    className="h-12 pl-10 rounded-xl border-2 border-orange-500/20 bg-orange-500/5 focus:bg-background transition-all font-black text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Observations</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Record your psychology, strategy, and thesis for this execution..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="min-h-[140px] w-full rounded-xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-medium text-xs p-4 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              {loading ? 'Transmitting...' : 'Confirm Execution'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="font-bold opacity-60 hover:opacity-100"
            >
              Abort Operation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
