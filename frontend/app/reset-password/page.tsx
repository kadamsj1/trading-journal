'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { KeyRound, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. No token provided.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Invalid reset link.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authApi.resetPassword({ token, new_password: password });
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to reset password. Token might be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl overflow-hidden hover:shadow-primary/5 transition-all">
            <CardContent className="p-8 md:p-12">
                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/5 border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                Access Error: {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">New Access Key</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <KeyRound className="h-4 w-4" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Verify Access Key</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform mt-4"
                            disabled={isLoading || !token}
                        >
                            {isLoading ? 'EXECUTING...' : 'OVERWRITE ACCESS KEY'}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="p-6 rounded-2xl bg-green-500/5 border-2 border-green-500/20">
                            <p className="text-sm font-bold text-green-500 uppercase tracking-widest leading-relaxed">
                                Terminal Access Restored Successfully.<br />Redirecting to Login...
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary selection:text-white relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full -ml-48 -mb-48" />

            <div className="absolute top-8 right-8">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-lg relative z-10 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 mb-4 animate-in zoom-in duration-500">
                        <Zap className="h-8 w-8 text-white fill-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Security <span className="text-primary">Override</span></h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">Master Reset Sequence</p>
                </div>

                <Suspense fallback={
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl p-12 text-center font-bold">
                        INITIALIZING RECOVERY...
                    </Card>
                }>
                    <ResetPasswordForm />
                </Suspense>

                <div className="text-center">
                    <Link href="/login" className="text-xs font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity italic">
                        Abort Override and Exit
                    </Link>
                </div>
            </div>
        </div>
    );
}
