'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { portfoliosApi, analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Calendar as CalendarIcon
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    startOfWeek,
    endOfWeek,
    isToday
} from 'date-fns';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface DayData {
    date: string;
    profit_loss: number;
    trade_count: number;
}

export default function TradingCalendarPage() {
    const params = useParams();
    const router = useRouter();
    const portfolioId = parseInt(params.id as string);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailyPL, setDailyPL] = useState<Record<string, DayData>>({});
    const [loading, setLoading] = useState(true);
    const [portfolioName, setPortfolioName] = useState('');

    useEffect(() => {
        fetchData();
    }, [portfolioId]);

    const fetchData = async () => {
        try {
            const [portRes, analyticsRes] = await Promise.all([
                portfoliosApi.getById(portfolioId),
                analyticsApi.getDailyPL(portfolioId)
            ]);

            setPortfolioName(portRes.data.name);

            const plData: Record<string, DayData> = {};
            analyticsRes.data.daily_pl.forEach((item: DayData) => {
                plData[item.date] = item;
            });
            setDailyPL(plData);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground font-medium animate-pulse">Syncing Trading History...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-2xl h-14 w-14 border bg-card shadow-sm hover:scale-110 transition-transform"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter">Trading <span className="text-primary italic">Calendar</span></h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Historical performance visibility for <span className="text-foreground font-bold">{portfolioName}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-card border rounded-2xl p-2 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-6 text-sm font-black uppercase tracking-widest min-w-[160px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl h-10 w-10">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Monthly Peak</p>
                    <p className="text-xl font-black text-green-500">
                        {formatINR(Math.max(...Object.values(dailyPL)
                            .filter(d => isSameMonth(new Date(d.date), currentDate))
                            .map(d => d.profit_loss), 0))}
                    </p>
                </div>
                <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Monthly Drawdown</p>
                    <p className="text-xl font-black text-red-500">
                        {formatINR(Math.min(...Object.values(dailyPL)
                            .filter(d => isSameMonth(new Date(d.date), currentDate))
                            .map(d => d.profit_loss), 0))}
                    </p>
                </div>
                <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Trading Days</p>
                    <p className="text-xl font-black">
                        {Object.values(dailyPL).filter(d => isSameMonth(new Date(d.date), currentDate) && d.trade_count > 0).length}
                    </p>
                </div>
                <div className="bg-card border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Efficiency</p>
                    <p className="text-xl font-black text-primary">
                        {Object.values(dailyPL).filter(d => isSameMonth(new Date(d.date), currentDate) && d.profit_loss > 0).length}W / {Object.values(dailyPL).filter(d => isSameMonth(new Date(d.date), currentDate) && d.profit_loss < 0).length}L
                    </p>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card">
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {weekDays.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 border-collapse">
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const data = dailyPL[dateStr];
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);
                        const pl = data?.profit_loss || 0;
                        const hasData = !!data;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "min-h-[140px] p-4 border border-muted/20 relative transition-all group hover:z-10 hover:shadow-2xl hover:scale-[1.02]",
                                    !isCurrentMonth && "bg-muted/5 opacity-30",
                                    isTodayDate && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-black transition-colors",
                                        isTodayDate ? "bg-primary text-white" : "group-hover:bg-muted"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {hasData && (
                                        <span className="text-[9px] font-black uppercase tracking-tighter bg-muted/50 px-2 py-0.5 rounded-md opacity-40">
                                            {data.trade_count} Trades
                                        </span>
                                    )}
                                </div>

                                {hasData && pl !== 0 && (
                                    <div className={cn(
                                        "space-y-1 animate-in fade-in duration-500",
                                        pl > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        <div className="flex items-center gap-1">
                                            {pl > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            <span className="text-xs font-black uppercase tracking-widest">
                                                {pl > 0 ? 'Profit' : 'Loss'}
                                            </span>
                                        </div>
                                        <div className="text-lg font-black tracking-tighter italic">
                                            {pl > 0 ? '+' : ''}{formatINR(pl)}
                                        </div>
                                        <div className={cn(
                                            "h-1 w-full rounded-full opacity-30",
                                            pl > 0 ? "bg-green-500" : "bg-red-500"
                                        )} />
                                    </div>
                                )}

                                {!hasData && isCurrentMonth && day < new Date() && (
                                    <div className="absolute inset-x-4 bottom-4 text-[10px] font-bold text-muted-foreground opacity-20 uppercase">
                                        No Records
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="flex items-center justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500" />
                    Profitable Session
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500" />
                    Loss Session
                </div>
                <div className="flex items-center gap-2 text-primary opacity-100">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    Today
                </div>
            </div>
        </div>
    );
}
