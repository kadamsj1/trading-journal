'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { alertsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Bell, ArrowLeft, Zap, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NewAlertPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        symbol: '',
        price: '',
        condition: 'above',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await alertsApi.create({
                symbol: formData.symbol.toUpperCase(),
                price: parseFloat(formData.price),
                condition: formData.condition,
                message: formData.message || undefined,
            });
            router.push('/dashboard/alerts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'System Failure: Failed to initialize signal alert.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/alerts">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Signal Configuration</p>
                    <h1 className="text-4xl font-black tracking-tighter italic">Create <span className="text-primary italic">Alert</span></h1>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/5 border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> {error}
                                    </div>
                                )}

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label htmlFor="symbol" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Asset Symbol</Label>
                                        <div className="relative group">
                                            <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="symbol"
                                                placeholder="RELIANCE, TCS, etc."
                                                value={formData.symbol}
                                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                                className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6 uppercase"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Trigger Price (₹)</Label>
                                        <div className="relative group">
                                            <Target className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="condition" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Trigger Condition</Label>
                                    <Select
                                        value={formData.condition}
                                        onValueChange={(value: string) => setFormData({ ...formData, condition: value })}
                                    >
                                        <SelectTrigger className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold px-6">
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-2">
                                            <SelectItem value="above" className="font-bold py-3 hover:bg-primary/10">Price Crosses Above</SelectItem>
                                            <SelectItem value="below" className="font-bold py-3 hover:bg-primary/10">Price Drops Below</SelectItem>
                                            <SelectItem value="crossing" className="font-bold py-3 hover:bg-primary/10">Price Crosses Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">System Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Strategy notes or signal context..."
                                        value={formData.message}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                        className="min-h-[120px] rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold p-6 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 rounded-2xl font-black text-xl bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform mt-4"
                                    disabled={loading}
                                >
                                    {loading ? 'INITIALIZING...' : 'INITIALIZE SYSTEM ALERT'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl shadow-primary/20">
                        <TrendingUp className="h-10 w-10 mb-6 opacity-80" />
                        <h3 className="text-2xl font-black mb-4 leading-tight italic">Precision Monitoring</h3>
                        <p className="text-sm font-bold opacity-80 leading-relaxed uppercase tracking-widest text-[10px]">
                            Set custom price levels for any NSE/BSE asset. The system will monitor market ticks and trigger your custom signal when conditions are met.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-muted flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
                            <Bell className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alerts are processed in real-time within the core analysis engine.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
