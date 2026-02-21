'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { Zap, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else {
        setError('Verification Failure: Access Denied.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full -ml-48 -mb-48" />

      <div className="absolute top-8 left-8 hidden md:block">
        <Link href="/">
          <Button variant="ghost" className="font-bold gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to System Home
          </Button>
        </Link>
      </div>

      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 mb-4 animate-in zoom-in duration-500">
            <Zap className="h-8 w-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Access <span className="text-primary">Terminal</span></h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">Authorize Session</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-xl overflow-hidden hover:shadow-primary/5 transition-all border-t border-t-white/10">
          <CardContent className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  System Error: {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Identifier</Label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username or Email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-16 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Access Key</Label>
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
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'INITIATING...' : 'INITIALIZE SESSION'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            New Operator? {' '}
            <Link href="/register" className="text-primary hover:text-primary/80 underline decoration-2 underline-offset-4">
              Register Terminal
            </Link>
          </p>
          <div className="flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 pt-4">
            <span className="text-xs font-black uppercase tracking-widest italic">Encrypted</span>
            <span className="text-xs font-black uppercase tracking-widest italic">FastAPI 2.0</span>
            <span className="text-xs font-black uppercase tracking-widest italic">JWT Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
