'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { alertsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Bell,
    Trash2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Zap,
    Search,
    CheckCircle2,
    Clock,
    LayoutGrid
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Alert {
    id: number;
    symbol: string;
    price: number;
    condition: 'above' | 'below' | 'crossing';
    message: string | null;
    is_active: boolean;
    is_triggered: boolean;
    triggered_at: string | null;
    created_at: string;
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await alertsApi.getAll();
            setAlerts(response.data);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteAlert = async (id: number) => {
        if (!confirm('Confirm decommissioning of this signal alert?')) return;
        try {
            await alertsApi.delete(id);
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    const toggleAlertStatus = async (alert: Alert) => {
        try {
            const response = await alertsApi.update(alert.id, { is_active: !alert.is_active });
            setAlerts(alerts.map(a => a.id === alert.id ? response.data : a));
        } catch (error) {
            console.error('Failed to update alert:', error);
        }
    };

    const filteredAlerts = alerts.filter(a =>
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.message && a.message.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <LoadingScreen message="Syncing Control Center" />;
    }

    return (
        <div className="space-y-10 pb-10">
            <div className="bg-gradient-to-br from-primary/5 via-background to-background p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Bell className="h-40 w-40" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Signal Monitor</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">Market <span className="text-primary italic">Alerts</span></h1>
                        <p className="text-muted-foreground font-medium max-w-md">
                            Monitoring <span className="text-foreground font-bold">{alerts.filter(a => a.is_active).length} active signals</span> across the Indian market segments.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/dashboard/alerts/new">
                            <Button className="h-14 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2 uppercase tracking-tighter">
                                <Plus className="h-6 w-6" />
                                New Signal Access
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="relative w-full sm:w-[350px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search signals by ticker or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 rounded-2xl border bg-card/50 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-muted/40 p-1 rounded-xl">
                    <Button variant="ghost" size="sm" className="rounded-lg h-9 bg-card px-4">
                        <LayoutGrid className="h-4 w-4 mr-2" /> Global Terminal
                    </Button>
                </div>
            </div>

            {alerts.length === 0 ? (
                <Card className="border-2 border-dashed bg-muted/5 rounded-[3rem]">
                    <CardContent className="flex flex-col items-center justify-center p-24 text-center">
                        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-6 animate-pulse">
                            <Bell className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-3xl font-black mb-3 italic uppercase">Zero Active Signals</h3>
                        <p className="text-muted-foreground mb-10 max-w-sm font-medium uppercase text-[11px] tracking-widest leading-relaxed">
                            Initialize a new market scanning alert to receive instant notifications when price actions hit your targets.
                        </p>
                        <Link href="/dashboard/alerts/new">
                            <Button size="lg" className="rounded-2xl px-10 font-black h-16 bg-primary hover:scale-[1.02] transition-transform uppercase tracking-tighter text-lg shadow-xl shadow-primary/20">
                                <Plus className="mr-2 h-6 w-6" />
                                Deploy First Signal
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredAlerts.map((alert) => (
                        <div key={alert.id} className="group relative">
                            <div className={cn(
                                "absolute -inset-0.5 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500",
                                alert.is_triggered ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-primary to-blue-500"
                            )}></div>
                            <Card className="relative border-2 border-transparent bg-card group-hover:border-primary/10 transition-all duration-300 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-1">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                                alert.is_triggered
                                                    ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30"
                                                    : "bg-muted/40 border-transparent text-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30"
                                            )}>
                                                {alert.condition === 'above' ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors italic">{alert.symbol}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                                    {alert.condition === 'above' ? 'Crosses Above' : alert.condition === 'below' ? 'Drops Below' : 'Hits Level'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleAlertStatus(alert)}
                                                className={cn(
                                                    "rounded-xl h-10 w-10 transition-colors",
                                                    alert.is_active ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Clock className={cn("h-5 w-5", !alert.is_active && "opacity-40")} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteAlert(alert.id)}
                                                className="rounded-xl h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-muted/40 border border-muted/50 mb-6 group-hover:bg-card group-hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Trigger Threshold</span>
                                            <span className="text-2xl font-black text-foreground">{formatINR(alert.price)}</span>
                                        </div>
                                        {alert.message && (
                                            <p className="text-xs font-bold text-muted-foreground bg-background/50 p-3 rounded-xl border border-dashed italic">
                                                "{alert.message}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {alert.is_triggered ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span className="text-[10px] font-black uppercase">Signal Triggered</span>
                                                </div>
                                            ) : alert.is_active ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 animate-pulse">
                                                    <Zap className="h-3 w-3 fill-primary" />
                                                    <span className="text-[10px] font-black uppercase">Monitoring</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground rounded-full border">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span className="text-[10px] font-black uppercase">Deactivated</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-tighter">
                                            Created {format(new Date(alert.created_at), 'dd MMM')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}

                    {/* New Signal Shortcut */}
                    <Link href="/dashboard/alerts/new" className="group">
                        <Card className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 bg-transparent transition-all duration-500 rounded-[2.5rem] h-full flex flex-col items-center justify-center p-12 text-center group-hover:shadow-2xl">
                            <div className="h-20 w-20 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                                <Plus className="h-10 w-10 text-muted-foreground group-hover:text-white" />
                            </div>
                            <h3 className="text-2xl font-black mb-1 group-hover:text-primary transition-colors uppercase italic italic tracking-tighter">Add Signal</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Deploy Market Monitor</p>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    );
}
