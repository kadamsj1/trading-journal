'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  LineChart,
  Users,
  LogOut,
  Zap,
  Menu,
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    {
      title: 'Command Center',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Global portfolio metrics'
    },
    {
      title: 'Strategy Vaults',
      href: '/dashboard/portfolios',
      icon: FolderKanban,
      description: 'Portfolio management'
    },
    {
      title: 'Deep Analytics',
      href: '/dashboard/analytics',
      icon: LineChart,
      description: 'Performance insights'
    },
    {
      title: 'Active Alerts',
      href: '/dashboard/alerts',
      icon: Bell,
      description: 'Signal management'
    },
  ];

  if (user?.is_admin) {
    navItems.push({
      title: 'Terminal Access',
      href: '/dashboard/users',
      icon: Users,
      description: 'User management'
    });
  }

  const NavContent = () => (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-xl border-r shadow-2xl">
      <div className="flex h-20 items-center justify-between px-6 border-b border-muted/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter leading-none">Smart<span className="text-primary italic">Journal</span></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">v2.0 Beta</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Main Navigator</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 relative overflow-hidden',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "p-2 rounded-xl transition-all duration-500",
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground group-hover:bg-card group-hover:shadow-md"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-[10px] font-medium opacity-60 leading-none mt-1">{item.description}</span>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 relative z-10 animate-pulse" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-muted/30">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Quick Tools</p>
          <div className="space-y-1">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Dark System
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-muted/50 bg-muted/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-card border-2 flex items-center justify-center p-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <UserIcon className="h-6 w-6 relative z-10" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-black truncate">{user?.full_name || user?.username}</p>
            <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter">{user?.email}</p>
            {user?.is_admin && (
              <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase mt-1">
                <ShieldCheck className="h-3 w-3" /> Root access
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 rounded-2x border-2 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Terminate Session
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden border-r bg-card md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 shadow-xl">
        <NavContent />
      </div>

      <div className="md:hidden flex items-center justify-between p-4 h-20 border-b bg-card-50 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter">Smart<span className="text-primary italic">Journal</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border bg-muted/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="md:hidden h-20" /> {/* Spacer for mobile */}
    </>
  );
}
