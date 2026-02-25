'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { ShieldAlert, ArrowLeft, Mail, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authApi.forgotPassword(email);
            setMessage(response.data.message);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to request password reset. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary selection:text-white relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full -ml-48 -mb-48" />

            <div className="absolute top-8 left-8 hidden md:block">
                <Link href="/login">
                    <Button variant="ghost" className="font-bold gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Return to Terminal
                    </Button>
                </Link>
            </div>

            <div className="absolute top-8 right-8">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-lg relative z-10 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 mb-4 animate-in zoom-in duration-500">
                        <ShieldAlert className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Recovery <span className="text-primary">Protocol</span></h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">Authorize Reset Link</p>
                </div>

                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        {!message ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/5 border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        Protocol Error: {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Authorized Email</Label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="operator@system.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'INITIATING...' : 'REQUEST PROTOCOL'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6 py-4">
                                <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/20">
                                    <p className="text-sm font-bold text-foreground leading-relaxed italic">
                                        {message}
                                    </p>
                                </div>
                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full h-16 rounded-2xl font-black border-2 border-primary/20 hover:bg-primary/5">
                                        RETURN TO TERMINAL
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20 italic">
                        Secure Cryptographic Recovery
                    </p>
                </div>
            </div>
        </div>
    );
}
