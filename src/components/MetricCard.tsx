import React from 'react';

interface MetricCardProps {
    label: string;
    val: number;
    max: number;
    unit: string;
    color: string;
}

const MetricCard = React.memo(({ label, val, max, unit, color }: MetricCardProps) => {
    const percent = Math.min(100, Math.max(0, (val / max) * 100));
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]',
        violet: 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
        emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
        rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    };

    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group relative overflow-hidden backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{label}</span>
                <span className="text-xs font-mono text-zinc-600">{percent.toFixed(0)}%</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3 relative z-10">
                <span className="text-2xl font-bold text-white tracking-tighter font-mono">{val.toFixed(1)}</span>
                <span className="text-zinc-600 text-xs font-bold">{unit}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${colorClasses[color]}`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
            <div
                className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 blur-3xl ${color === 'rose' ? 'bg-rose-500' : `bg-${color}-500`}`}
            ></div>
        </div>
    );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
