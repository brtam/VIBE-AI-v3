import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    color?: string;
}

const Badge = React.memo(({ children, color = 'zinc' }: BadgeProps) => {
    const colors: Record<string, string> = {
        zinc: 'bg-zinc-800/50 border-zinc-700 text-zinc-400',
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[color] || colors.zinc}`}>
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

export default Badge;
