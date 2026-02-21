'use client';

import { Loader2, Zap } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full space-y-8 animate-in fade-in duration-1000">
            <div className="relative">
                {/* Outer Glow */}
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />

                {/* Spinning Outer Ring */}
                <div className="h-24 w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />

                {/* Inner Hub */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-card border shadow-xl flex items-center justify-center animate-bounce">
                        <Zap className="h-6 w-6 text-primary fill-primary/20" />
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Initializing <span className="text-primary">Terminal</span></h2>
                <div className="flex items-center justify-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50 pt-4">Synchronizing Market Data Feeds</p>
            </div>
        </div>
    );
}
