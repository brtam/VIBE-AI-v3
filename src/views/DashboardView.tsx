import React, { useRef, useEffect } from 'react';
import { SystemTelemetry } from '../types';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import MetricCard from '../components/MetricCard';

interface DashboardViewProps {
    system: SystemTelemetry;
    onAction: (action: string) => void;
}

const DashboardView = ({ system, onAction }: DashboardViewProps) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [system.logs]);

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1 font-mono">COMMAND_CENTER</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider flex items-center gap-2">
                        VIBE-LOCAL-01
                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                        <span className="text-emerald-500 font-bold text-[10px]">ONLINE</span>
                    </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    LIVE_STREAM
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard label="VRAM Usage" val={system.vramUsage} max={system.vramTotal} unit="GB" color="indigo" />
                <MetricCard label="RAM Usage" val={system.ramUsage} max={system.ramTotal} unit="GB" color="violet" />
                <MetricCard label="GPU Temp" val={system.gpuTemp} max={100} unit="°C" color={system.gpuTemp > 80 ? 'rose' : 'emerald'} />

                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors backdrop-blur-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Services</span>
                        <Icon name="dns" className="text-zinc-600" size="text-sm" />
                    </div>
                    <div className="flex-1 flex flex-wrap content-start gap-2">
                        {system.activeServices.map(s => (
                            <Badge key={s} color="emerald">{s}</Badge>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[28rem]">
                {/* Quick Actions */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden backdrop-blur-md">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                        <Icon name="bolt" className="text-amber-400/80" size="text-base"/> Quick Exec
                    </h3>
                    <div className="grid grid-cols-1 gap-3 relative z-10">
                        <button onClick={() => onAction('purge')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-700/30 hover:border-indigo-500/30 transition-all group text-left">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Icon name="cleaning_services" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-200 group-hover:text-white">Purge Cache</div>
                                <div className="text-[10px] text-zinc-500 font-mono">VRAM Optimization</div>
                            </div>
                        </button>
                        <button onClick={() => onAction('update')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-700/30 hover:border-emerald-500/30 transition-all group text-left">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Icon name="update" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-200 group-hover:text-white">Sys Update</div>
                                <div className="text-[10px] text-zinc-500 font-mono">Git Pull & Rebuild</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Terminal */}
                <div className="lg:col-span-2 bg-black border border-white/10 rounded-2xl flex flex-col shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">SYSTEM_LOG</span>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 font-mono text-[11px]">
                        {system.logs.map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 transition-colors opacity-80 hover:opacity-100">
                                <span className="text-zinc-600 shrink-0 select-none">{log.timestamp}</span>
                                <span className={`break-all ${
                                    log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'warn' ? 'text-amber-400' :
                                    log.type === 'net' ? 'text-cyan-400' : 'text-zinc-300'
                                }`}>
                                    {log.type !== 'info' && <span className="font-bold">[{log.type.toUpperCase()}] </span>}
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        <div ref={logEndRef} className="animate-pulse text-indigo-500 pl-2">_</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
