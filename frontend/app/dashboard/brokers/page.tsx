'use client';

import { useEffect, useState } from 'react';
import { brokersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Trash2,
    Zap,
    ShieldCheck,
    Key,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Settings2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Broker {
    id: number;
    broker_name: string;
    client_id: string | null;
    is_active: boolean;
    created_at: string;
}

export default function BrokersPage() {
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [loading, setLoading] = useState(true);
    const [addModal, setAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        broker_name: 'dhan',
        client_id: '',
        api_key: '',
        api_secret: ''
    });

    useEffect(() => {
        fetchBrokers();

        // Handle OAuth callback status
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const message = urlParams.get('message');

        if (status === 'success') {
            toast({ title: '✅ Connection Verified', description: 'Session token has been established successfully.' });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            toast({ variant: 'destructive', title: 'Connection Failed', description: message || 'OAuth exchange failed.' });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchBrokers = async () => {
        try {
            const response = await brokersApi.getAll();
            setBrokers(response.data);
        } catch (error) {
            console.error('Failed to fetch brokers:', error);
            toast({ variant: 'destructive', title: 'Fetch Error', description: 'Could not load broker connections.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddBroker = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await brokersApi.create(formData);
            toast({ title: '✅ Connection Authorized', description: `${formData.broker_name.toUpperCase()} has been linked to your terminal.` });
            setAddModal(false);
            setFormData({ broker_name: 'dhan', client_id: '', api_key: '', api_secret: '' });
            fetchBrokers();
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to authorize broker connection.';
            toast({ variant: 'destructive', title: 'Authorization Failed', description: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBroker = async (id: number) => {
        if (confirm('Are you sure you want to terminate this connection? This will prevent automatic syncing.')) {
            try {
                await brokersApi.delete(id);
                toast({ title: 'Connection Terminated', description: 'Broker link has been removed.' });
                fetchBrokers();
            } catch (error) {
                toast({ variant: 'destructive', title: 'De-authorization Failed', description: 'Failed to remove broker connection.' });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Data Bridges...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-card rounded-[2.5rem] border shadow-xl p-8 md:p-12">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-20 h-64 w-64 bg-primary/10 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-2">
                            <Settings2 className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none italic uppercase">
                            Broker <span className="text-primary italic font-black">Gateways</span>
                        </h1>
                        <p className="text-lg font-bold text-muted-foreground max-w-lg leading-relaxed">
                            Link your institutional trading accounts via secure API bridges for automated synchronization.
                        </p>
                    </div>
                    <Button onClick={() => setAddModal(true)} className="h-16 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.05] transition-transform">
                        <Plus className="mr-2 h-6 w-6" /> Authorize New Bridge
                    </Button>
                </div>
            </div>

            <div className="grid gap-10 md:grid-cols-1">
                {brokers.length === 0 ? (
                    <Card className="border-2 border-dashed bg-muted/5 rounded-[3rem]">
                        <CardContent className="flex flex-col items-center justify-center p-24 text-center">
                            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-8 relative">
                                <Zap className="h-12 w-12 text-muted-foreground opacity-20" />
                                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black italic mb-3">No Active Data Bridges</h2>
                            <p className="text-muted-foreground max-w-md font-bold text-sm leading-relaxed mb-10">
                                Your terminal is currently offline. Connect a broker API to start receiving high-frequency trade data and performance metrics.
                            </p>
                            <Button onClick={() => setAddModal(true)} className="rounded-2xl font-black px-12 h-14 text-lg">Initialize Setup</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {brokers.map((broker) => (
                            <Card key={broker.id} className="relative overflow-hidden border-2 bg-card hover:border-primary transition-all rounded-[2rem] shadow-sm hover:shadow-2xl group">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Active Link</span>
                                    </div>
                                </div>

                                <CardHeader className="pb-2">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-500">
                                        <Zap className="h-8 w-8 text-primary group-hover:text-white" />
                                    </div>
                                    <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">{broker.broker_name}</CardTitle>
                                    <CardDescription className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                                        <Smartphone className="h-3 w-3" /> ID: {broker.client_id || 'REDACTED'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 border-t border-muted/30">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Last Deployment</p>
                                            <p className="text-xs font-bold">{new Date(broker.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Status</p>
                                            <p className="text-xs font-black text-primary">SECURE</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {broker.broker_name === 'iifl' && (
                                            <>
                                                <Button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await brokersApi.getIIFLLoginUrl();
                                                            window.location.href = res.data.login_url;
                                                        } catch (err: any) {
                                                            toast({
                                                                variant: 'destructive',
                                                                title: 'Login Link Failed',
                                                                description: err.response?.data?.detail || 'Could not reach IIFL Gateway'
                                                            });
                                                        }
                                                    }}
                                                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-extrabold transition-all gap-2"
                                                >
                                                    <ShieldCheck className="h-4 w-4" /> PROVISION SESSION
                                                </Button>
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Redirect Issue?</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground leading-tight">
                                                        If IIFL gets stuck after login, check the address bar for <span className="text-primary">authcode=...</span> and <span className="text-primary">clientid=...</span> then click the link below to manually finish.
                                                    </p>
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 text-[10px] font-black uppercase text-primary underline"
                                                        onClick={() => {
                                                            const input = prompt("Paste the full URL from the IIFL page (it contains authcode and clientid):");
                                                            if (input) {
                                                                try {
                                                                    const url = new URL(input.includes('http') ? input : `http://dummy.com/${input}`);
                                                                    const authcode = url.searchParams.get('authcode');
                                                                    const clientid = url.searchParams.get('clientid');
                                                                    if (authcode && clientid) {
                                                                        window.location.href = `/api/brokers/iifl/callback?authcode=${authcode}&clientid=${clientid}`;
                                                                    } else {
                                                                        alert("Could not find authcode or clientid in that text.");
                                                                    }
                                                                } catch (e) {
                                                                    alert("Invalid URL format.");
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Manual Callback Completion
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDeleteBroker(broker.id)}
                                            className="w-full h-12 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-all gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" /> Terminate Bridge
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Broker Modal */}
            <Dialog open={addModal} onOpenChange={setAddModal}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
                    <div className="bg-primary p-8 text-white relative h-32 flex items-end">
                        <ShieldCheck className="absolute top-6 right-8 h-20 w-20 opacity-20" />
                        <div className="relative z-10">
                            <DialogTitle className="text-3xl font-black italic uppercase leading-none">Bridge Authorization</DialogTitle>
                            <DialogDescription className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Establishing secure data tunnel</DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleAddBroker} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1">Network Provider</Label>
                            <Select
                                value={formData.broker_name}
                                onValueChange={(val) => setFormData({ ...formData, broker_name: val })}
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                                    <SelectValue placeholder="Select high-frequency provider" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2">
                                    <SelectItem value="dhan" className="font-bold">DHAN (Persistent Token)</SelectItem>
                                    <SelectItem value="iifl" className="font-bold">IIFL (Desktop Token)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1">Client ID / Username</Label>
                            <div className="relative group">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="e.g. DHAN12345"
                                    className="h-14 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background font-bold transition-all"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1">API Key / App Access</Label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="PASTE_ENCRYPTED_KEY"
                                    className="h-14 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background font-bold transition-all"
                                    value={formData.api_key}
                                    onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1">API Secret / Persistent Token</Label>
                            <div className="relative group">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    className="h-14 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background font-bold transition-all"
                                    value={formData.api_secret}
                                    onChange={e => setFormData({ ...formData, api_secret: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black" onClick={() => setAddModal(false)}>ABORT</Button>
                            <Button type="submit" disabled={submitting} className="flex-1 h-16 rounded-2xl font-black bg-primary shadow-xl shadow-primary/30">
                                {submitting ? 'AUTHORIZING...' : 'ESTABLISH LINK'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
