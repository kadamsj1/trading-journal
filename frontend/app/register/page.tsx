'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { Zap, ArrowLeft, UserPlus, ShieldPlus, KeyRound, Mail, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Key Mismatch: Access Keys do not match.');
      return;
    }

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name || undefined,
      });
      router.push('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else {
        setError('Initialization Failure: Registry Error.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 h-96 w-96 bg-primary/10 blur-[120px] rounded-full -ml-48 -mt-48" />
      <div className="absolute bottom-0 right-0 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mb-48 opacity-50" />

      <div className="absolute top-8 left-8 hidden md:block">
        <Link href="/">
          <Button variant="ghost" className="font-bold gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> System Exit
          </Button>
        </Link>
      </div>

      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl relative z-10 py-12">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 mb-4 animate-in zoom-in duration-500">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Register <span className="text-primary italic">Terminal</span></h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">Initialize New Operator</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-xl overflow-hidden hover:shadow-primary/5 transition-all">
          <CardContent className="p-8 md:p-14">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  System Error: {error}
                </div>
              )}

              <div className="grid gap-8 md:grid-cols-2">
                {/* Identity Section */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldPlus className="h-3 w-3" /> Identity Matrix
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="operator@system.io"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Username</Label>
                      <div className="relative group">
                        <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="Choose Unique ID"
                          value={formData.username}
                          onChange={handleChange}
                          className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold pl-14 pr-6"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Legal Handle</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Full Name (Optional)"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold px-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <KeyRound className="h-3 w-3" /> Security Protocol
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Access Key</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold px-6"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 pl-2">Verify Key</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-14 rounded-2xl border-2 bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold px-6"
                        required
                      />
                    </div>

                    <div className="pt-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-tight">
                        Security Notice: Credentials are hashed with industry-standard protocols before storage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-2xl font-black text-xl bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform mt-6"
                disabled={isLoading}
              >
                {isLoading ? 'EXECUTING REGISTRY...' : 'LAUNCH TERMINAL v2.0'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-12 space-y-6">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Already an Operator? {' '}
            <Link href="/login" className="text-primary hover:text-primary/80 underline decoration-2 underline-offset-4">
              Access Terminal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
