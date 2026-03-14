import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Workflow } from '../types';
import { INITIAL_WORKFLOWS } from '../data/mocks';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import Button from '../components/Button';

interface WorkflowViewProps {
    loadFactorSetter: (n: number) => void;
}

const WorkflowView = ({ loadFactorSetter }: WorkflowViewProps) => {
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
    const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

    useEffect(() => {
        const intervals = intervalsRef.current;
        return () => {
            intervals.forEach(clearInterval);
            intervals.clear();
        };
    }, []);

    const toggleWorkflow = useCallback(
        (id: string) => {
            setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, status: 'running', progress: 0 } : w)));
            loadFactorSetter(2.5);

            let p = 0;
            const int = setInterval(() => {
                p += Math.random() * 15;
                if (p >= 100) {
                    p = 100;
                    clearInterval(int);
                    intervalsRef.current.delete(id);
                    setWorkflows((prev) =>
                        prev.map((w) => (w.id === id ? { ...w, status: 'completed', progress: 100 } : w))
                    );
                    loadFactorSetter(0.1);
                } else {
                    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, progress: p } : w)));
                }
            }, 400);
            intervalsRef.current.set(id, int);
        },
        [loadFactorSetter]
    );

    const renderWorkflowCard = (wf: Workflow) => (
        <div
            key={wf.id}
            className={`bg-zinc-900/40 border rounded-xl p-6 relative overflow-hidden group transition-all ${wf.status === 'running' ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]' : 'border-white/5 hover:border-white/10'}`}
        >
            {wf.status === 'running' && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300 ease-linear shadow-[0_0_10px_#6366f1]"
                    style={{ width: `${wf.progress}%` }}
                ></div>
            )}
            <div className="flex justify-between items-start mb-4">
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${wf.status === 'running' ? 'bg-indigo-600 text-white animate-pulse' : `bg-${wf.color}-500/10 text-${wf.color}-400`}`}
                >
                    <Icon name={wf.icon} />
                </div>
                {wf.status === 'completed' ? (
                    <Icon name="check_circle" className="text-emerald-500" />
                ) : (
                    <Badge>{wf.specs.vram}</Badge>
                )}
            </div>
            <h3 className="font-bold text-zinc-200 mb-1">{wf.title}</h3>
            <p className="text-xs text-zinc-500 mb-4 h-8 leading-relaxed line-clamp-2">{wf.description}</p>

            <div className="flex flex-wrap gap-1 mb-6 h-12 content-start">
                {wf.specs.models.map((m) => (
                    <span
                        key={m}
                        className="px-1.5 py-0.5 rounded-sm bg-zinc-800 text-[9px] text-zinc-400 border border-zinc-700/50 truncate max-w-[100px]"
                    >
                        {m}
                    </span>
                ))}
                {wf.specs.tools.map((t) => (
                    <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-sm bg-zinc-800 text-[9px] text-zinc-500 border border-zinc-700/50"
                    >
                        {t}
                    </span>
                ))}
            </div>

            {wf.status === 'running' ? (
                <div className="w-full py-2 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center gap-2 text-xs font-mono text-indigo-400">
                    <span className="animate-spin">
                        <Icon name="sync" />
                    </span>{' '}
                    Processing {Math.floor(wf.progress)}%
                </div>
            ) : (
                <Button
                    onClick={() => toggleWorkflow(wf.id)}
                    variant={wf.status === 'completed' ? 'secondary' : 'primary'}
                    className="w-full"
                    icon={wf.status === 'completed' ? 'restart_alt' : 'play_arrow'}
                >
                    {wf.status === 'completed' ? 'Rerun' : wf.category === 'template' ? 'Launch Template' : 'Execute'}
                </Button>
            )}
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
            <header className="mb-10">
                <h1 className="text-2xl font-bold text-white mb-2 font-mono">PIPELINE_MANAGER</h1>
                <p className="text-zinc-500 text-sm max-w-xl">
                    Orchestrate automated tasks. Workflows consume VRAM resources while active.
                </p>
            </header>

            <div className="mb-10">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon name="grid_view" size="text-sm" /> Clickable Templates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {workflows.filter((w) => w.category === 'template').map(renderWorkflowCard)}
                </div>
            </div>

            <div>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon name="settings_applications" size="text-sm" /> Utilities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {workflows.filter((w) => w.category === 'utility').map(renderWorkflowCard)}
                </div>
            </div>
        </div>
    );
};

export default WorkflowView;
