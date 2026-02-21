'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyPL {
    date: string;
    profit_loss: number;
    trade_count: number;
}

interface TradingCalendarProps {
    dailyPL: DailyPL[];
}

export function TradingCalendar({ dailyPL }: TradingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getDayData = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return dailyPL.find((pl) => pl.date === dateStr);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-xl font-bold">Trading Calendar</CardTitle>
                    <p className="text-sm text-muted-foreground">Daily realized profit and loss</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-muted rounded-md transition-colors border"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-bold min-w-[140px] text-center text-lg">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-muted rounded-md transition-colors border"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 mb-2 border-b pb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border border border-muted rounded-lg overflow-hidden shadow-sm">
                    {calendarDays.map((day, idx) => {
                        const data = getDayData(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        // Generate a background color based on P&L
                        let bgColor = 'bg-background';
                        if (data) {
                            if (data.profit_loss > 0) bgColor = 'bg-green-50/50 dark:bg-green-950/20';
                            else if (data.profit_loss < 0) bgColor = 'bg-red-50/50 dark:bg-red-950/20';
                        }

                        return (
                            <div
                                key={idx}
                                className={`min-h-[100px] p-2 flex flex-col relative transition-colors duration-200 ${bgColor} ${!isCurrentMonth ? 'opacity-30 grayscale-[0.5]' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-semibold ${isToday ? 'bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center' : 'text-foreground'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                    {data && data.trade_count > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-medium border border-border/50">
                                            {data.trade_count}
                                        </span>
                                    )}
                                </div>
                                {data && (
                                    <div className="mt-auto flex flex-col items-center">
                                        <div
                                            className={`text-[13px] font-black leading-tight ${data.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}
                                        >
                                            {data.profit_loss !== 0 && (data.profit_loss > 0 ? '+' : '')}
                                            {data.profit_loss !== 0 ? formatINR(data.profit_loss) : '-'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex flex-wrap gap-4 items-center text-xs font-medium border-t pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 bg-green-500 rounded-sm"></div>
                        <span className="text-muted-foreground uppercase tracking-tight">Profitable Day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 bg-red-500 rounded-sm"></div>
                        <span className="text-muted-foreground uppercase tracking-tight">Loss Day</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-muted-foreground">Total realize P&L is shown at day exit</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
