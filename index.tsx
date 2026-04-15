import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- 1. TYPES & INTERFACES ---

type ViewMode = 'dashboard' | 'explorer' | 'workflows' | 'agent' | 'blender' | 'settings';

interface SystemTelemetry {
  vramUsage: number;
  vramTotal: number;
  gpuTemp: number;
  ramUsage: number;
  ramTotal: number;
  activeServices: string[];
  logs: LogEntry[];
  isSimulated: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'net';
}

interface AgentMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  snapshot?: {
    vram: string;
    temp: string;
  };
}

interface Preset {
  id: string;
  label: string;
  command: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'code' | 'image' | 'model' | 'video';
  size?: string;
  date: string;
  children?: FileItem[];
}

interface Workflow {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progress: number;
    category: 'template' | 'utility';
    specs: {
        vram: string;
        models: string[];
        tools: string[];
    };
}

// --- 2. CONSTANTS & MOCK DATA ---

const INITIAL_SYSTEM_STATE: SystemTelemetry = {
    vramUsage: 3.2,
    vramTotal: 12,
    gpuTemp: 42.0,
    ramUsage: 8.4,
    ramTotal: 32,
    activeServices: ['Ollama Service', 'ComfyUI Backend'],
    logs: [
        { id: '1', timestamp: '10:00:01', message: 'VIBE System Core initialized', type: 'info' },
        { id: '2', timestamp: '10:00:02', message: 'Network listener active on port 3000', type: 'net' }
    ],
    isSimulated: true
};

const MOCK_FILES: FileItem[] = [
    { id: 'root', name: 'root', type: 'folder', date: '-', children: [
        { id: 'models', name: 'models', type: 'folder', date: '2024-05-20', children: [
            { id: 'ckpt', name: 'checkpoints', type: 'folder', date: '2024-05-20', children: []},
            { id: 'llama3', name: 'llama-3-8b-instruct.gguf', type: 'model', size: '5.2GB', date: '2024-05-15' },
            { id: 'sdxl', name: 'sdxl_turbo_v1.0.safetensors', type: 'model', size: '6.9GB', date: '2024-05-10' },
        ]},
        { id: 'proj', name: 'projects', type: 'folder', date: '2024-02-10', children: [
            { id: 'py1', name: 'vibe_core.py', type: 'code', size: '12KB', date: 'Today 11:00' },
            { id: 'ts1', name: 'utils.ts', type: 'code', size: '4KB', date: 'Yesterday' }
        ]},
        { id: 'out', name: 'outputs', type: 'folder', date: '2024-05-21', children: [
            { id: 'img1', name: 'render_0042.png', type: 'image', size: '2.4MB', date: 'Today 10:23' },
            { id: 'vid1', name: 'scene_sequence_01.mp4', type: 'video', size: '45.2MB', date: 'Today 10:25' },
        ]},
    ]}
];

const INITIAL_WORKFLOWS: Workflow[] = [
    // TEMPLATES
    { 
        id: 'upscale', 
        title: 'Image Upscaling', 
        description: 'Real-ESRGAN 4x restoration pipeline for high-fidelity upscaling.', 
        icon: 'photo_size_select_large', 
        color: 'blue', 
        status: 'idle', 
        progress: 0, 
        category: 'template',
        specs: { vram: '4.2 GB', models: ['RealESRGAN_x4plus'], tools: ['OpenCV', 'TileBuffer'] }
    },
    { 
        id: 'video_edit', 
        title: 'Smart Video Edit', 
        description: 'Automated scene cut detection and flow-based interpolation.', 
        icon: 'movie_edit', 
        color: 'rose', 
        status: 'idle', 
        progress: 0, 
        category: 'template',
        specs: { vram: '6.5 GB', models: ['RIFE-v4.6', 'PySceneDetect'], tools: ['FFmpeg'] }
    },
    { 
        id: 'img2vid', 
        title: 'Image to Video', 
        description: 'Generate fluid motion sequences from static source images.', 
        icon: 'motion_photos_auto', 
        color: 'violet', 
        status: 'idle', 
        progress: 0, 
        category: 'template',
        specs: { vram: '10.8 GB', models: ['SVD-XT-1.1', 'MotionCtrl'], tools: ['ComfyUI'] }
    },
    // UTILITIES
    { 
        id: 'voice', 
        title: 'TTS Synthesis', 
        description: 'Generate speech using Coqui TTS.', 
        icon: 'record_voice_over', 
        color: 'purple', 
        status: 'idle', 
        progress: 0, 
        category: 'utility',
        specs: { vram: '2.0 GB', models: ['XTTS-v2'], tools: ['TorchAudio'] }
    },
    { 
        id: 'code', 
        title: 'Code Audit', 
        description: 'DeepSeek Coder security analysis.', 
        icon: 'code', 
        color: 'emerald', 
        status: 'idle', 
        progress: 0, 
        category: 'utility',
        specs: { vram: '8.0 GB', models: ['DeepSeek-Coder-33B'], tools: ['LlamaCPP'] }
    },
    { 
        id: 'train', 
        title: 'LoRA Training', 
        description: 'Fine-tune SDXL on local dataset.', 
        icon: 'model_training', 
        color: 'orange', 
        status: 'idle', 
        progress: 0, 
        category: 'utility',
        specs: { vram: '12.0 GB', models: ['SDXL Base 1.0'], tools: ['Kohya_ss'] }
    }
];

// --- 3. CUSTOM HOOKS ---

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            setStoredValue(prev => {
                const valueToStore = value instanceof Function ? value(prev) : value;
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                return valueToStore;
            });
        } catch (error) {
            console.error(error);
        }
    }, [key]);

    return [storedValue, setValue];
}

function useSystemTelemetry() {
    const [system, setSystem] = useState<SystemTelemetry>(INITIAL_SYSTEM_STATE);
    const loadFactorRef = useRef(0.1);

    const setLoadFactor = useCallback((factor: number) => {
        loadFactorRef.current = factor;
    }, []);

    const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
        const entry: LogEntry = {
            id: Date.now().toString() + Math.random(),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message: msg,
            type
        };
        setSystem(prev => ({ ...prev, logs: [...prev.logs.slice(-29), entry] }));
    }, []);

    useEffect(() => {
        if (!system.isSimulated) return;
        const interval = setInterval(() => {
            setSystem(prev => {
                const lf = loadFactorRef.current;
                let newVram = prev.vramUsage + (Math.random() - 0.45) * lf;
                newVram = Math.max(1.5, Math.min(prev.vramTotal - 0.2, newVram));

                let newTemp = prev.gpuTemp + (Math.random() - 0.4) * (lf * 2);
                newTemp = Math.max(35, Math.min(88, newTemp));

                return {
                    ...prev,
                    vramUsage: newVram,
                    gpuTemp: newTemp,
                    ramUsage: Math.max(4, Math.min(prev.ramTotal, prev.ramUsage + (Math.random() - 0.5) * 0.2))
                };
            });
        }, 1500); 
        return () => clearInterval(interval);
    }, [system.isSimulated]);

    return { system, setSystem, addLog, setLoadFactor };
}

// --- 4. UI PRIMITIVES ---

const Icon = React.memo(({ name, className, size = 'text-base' }: { name: string; className?: string, size?: string }) => (
  <span className={`material-symbols-outlined select-none ${size} ${className || ''}`} aria-hidden="true">{name}</span>
));

const Badge = React.memo(({ children, color = 'zinc' }: { children: React.ReactNode, color?: string }) => {
    const colors: Record<string, string> = {
        zinc: 'bg-zinc-800/50 border-zinc-700 text-zinc-400',
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colors[color] || colors.zinc}`}>
            {children}
        </span>
    );
});

const Button = React.memo(({ children, onClick, variant = 'primary', className, disabled, icon, title }: any) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    const variants: any = {
        primary: "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.25)] border border-indigo-500/50",
        secondary: "bg-zinc-800/50 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700 backdrop-blur-sm",
        danger: "bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/50",
        ghost: "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
            {icon && <Icon name={icon} />}
            {children}
        </button>
    );
});

// --- 5. FEATURE COMPONENTS ---

const Sidebar = React.memo(({ activeView, onViewChange }: { activeView: ViewMode, onViewChange: (v: ViewMode) => void }) => {
    const navItems = [
        { id: 'dashboard', icon: 'grid_view', label: 'Overview' },
        { id: 'explorer', icon: 'folder_open', label: 'Files' },
        { id: 'workflows', icon: 'hub', label: 'Pipelines' },
        { id: 'agent', icon: 'smart_toy', label: 'Neural Link' },
        { id: 'blender', icon: 'deployed_code', label: '3D Forge' }
    ];

    return (
        <nav className="w-20 border-r border-white/5 flex flex-col items-center py-6 bg-zinc-950 z-30 justify-between shadow-2xl relative">
             <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent"></div>
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-xl mb-6 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30 cursor-default relative group select-none">
                    <span className="text-lg z-10">V</span>
                    <div className="absolute inset-0 rounded-xl bg-indigo-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                </div>
                
                {navItems.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => onViewChange(item.id as ViewMode)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group relative mb-3 ${activeView === item.id ? 'bg-zinc-800/80 text-indigo-400 border border-zinc-700 shadow-inner' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
                        aria-label={item.label}
                    >
                        <Icon name={item.icon} className={activeView === item.id ? 'animate-pulse' : ''} />
                        {activeView === item.id && <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>}
                        {/* Tooltip */}
                        <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-zinc-200 text-[10px] font-bold uppercase rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50 translate-x-[-10px] group-hover:translate-x-0">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>
            
            <button onClick={() => onViewChange('settings')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
                <Icon name="settings" />
            </button>
        </nav>
    );
});

const MetricCard = React.memo(({ label, val, max, unit, color }: { label: string, val: number, max: number, unit: string, color: string }) => {
    const percent = Math.min(100, Math.max(0, (val / max) * 100));
    const colorClasses: any = {
        indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]',
        violet: 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
        emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
        rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
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
                    style={{width: `${percent}%`}}
                ></div>
            </div>
            {/* Background decorative glow */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 blur-3xl ${color === 'rose' ? 'bg-rose-500' : `bg-${color}-500`}`}></div>
        </div>
    );
});

const DashboardView = ({ system, onAction }: { system: SystemTelemetry, onAction: (action: string) => void }) => {
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

const AgentView = ({ system, onCommand }: { system: SystemTelemetry, onCommand: (cmd: string) => void }) => {
    const [history, setHistory] = useLocalStorage<AgentMessage[]>('vibe_agent_history', []);
    const [presets, setPresets] = useLocalStorage<Preset[]>('vibe_presets', []);
    const [input, setInput] = useState('');
    const [isThinking, setThinking] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isThinking]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isThinking) return;
        
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: trimmed,
            timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            snapshot: { vram: system.vramUsage.toFixed(1), temp: system.gpuTemp.toFixed(1) }
        };

        setHistory(prev => [...prev, userMsg]);
        setInput('');
        setThinking(true);

        if (trimmed.startsWith('/')) {
            setTimeout(() => {
                 const responseId = Date.now().toString();
                 let responseText = `Executing system directive: ${trimmed}`;
                 if (trimmed === '/clear') { setHistory([]); setThinking(false); return; }
                 setHistory(prev => [...prev, { id: responseId, role: 'ai', text: responseText, timestamp: new Date().toLocaleTimeString() }]);
                 setThinking(false);
                 onCommand(trimmed);
            }, 600);
            return;
        }

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                setHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: 'CONFIG_ERROR: Missing VITE_GEMINI_API_KEY. Add it to your .env.local.', timestamp: new Date().toLocaleTimeString() }]);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            const chat = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction: `You are VIBE (Virtual Interface for Base Operations). 
                    Persona: Highly efficient, slightly cynical cyberpunk system operator.
                    Context: Local AI Dashboard.
                    Telemetry: VRAM ${system.vramUsage.toFixed(1)}GB, Temp ${system.gpuTemp.toFixed(1)}°C.
                    Keep responses concise and technical.`
                }
            });
            
            const result = await chat.sendMessageStream({ message: trimmed });
            const aiMsgId = (Date.now() + 1).toString();
            setHistory(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', timestamp: new Date().toLocaleTimeString() }]);

            let fullText = '';
            for await (const chunk of result) {
                fullText += chunk.text;
                setHistory(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
            }
        } catch (e) {
            setHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: 'CONNECTION_ERROR: Neural link unstable.', timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setThinking(false);
        }
    };

    const savePreset = () => {
        if (!input) return;
        setPresets(prev => [...prev, { id: Date.now().toString(), label: input.substring(0, 12) + '...', command: input }]);
    };

    return (
        <div className="flex h-full animate-in fade-in duration-300 bg-zinc-950">
            <div className="flex-1 flex flex-col min-w-0 relative">
                 <div className="absolute top-0 w-full p-4 z-20 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none flex justify-between">
                    <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur text-[10px] font-mono text-zinc-400 shadow-lg">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        NEURAL_LINK_ESTABLISHED
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 pt-20 pb-32 space-y-8 custom-scrollbar" aria-live="polite">
                    {history.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
                            <Icon name="smart_toy" className="text-8xl mb-4 text-zinc-700"/>
                            <p className="font-mono text-sm text-zinc-500">AWAITING INPUT SEQUENCE</p>
                        </div>
                    )}
                    {history.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full group`}>
                            <div className="flex items-center gap-2 mb-1 px-1 opacity-40 text-[10px] font-mono">
                                <span className="uppercase font-bold">{msg.role === 'user' ? 'OP_01' : 'CORE_AI'}</span>
                                <span>{msg.timestamp}</span>
                            </div>
                            <div className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-lg border max-w-[85%] ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-100 rounded-tr-sm backdrop-blur-sm' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                {msg.snapshot && (
                                    <div className="mt-2 pt-2 border-t border-white/5 flex gap-3 text-[10px] font-mono text-zinc-500">
                                        <span className="flex items-center gap-1"><Icon name="memory" size="text-[12px]"/> {msg.snapshot.vram}G</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                         <div className="max-w-4xl mx-auto w-full flex flex-col items-start">
                            <div className="flex gap-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-tl-sm">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                         </div>
                    )}
                    <div ref={endRef} />
                 </div>

                 <div className="absolute bottom-0 w-full bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 p-4 z-30">
                    <div className="max-w-4xl mx-auto space-y-3">
                        {presets.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-linear">
                                {presets.map(p => (
                                    <button key={p.id} onClick={() => setInput(p.command)} className="flex-shrink-0 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-400 rounded-md transition-colors flex items-center gap-2 group">
                                        {p.label}
                                        <span onClick={(e) => {e.stopPropagation(); setPresets(prev => prev.filter(x=>x.id !== p.id))}} className="hover:text-rose-400 opacity-0 group-hover:opacity-100"><Icon name="close" size="text-[10px]"/></span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex gap-0 relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl opacity-20 group-focus-within:opacity-50 transition-opacity blur"></div>
                            <div className="relative flex-1 flex bg-black rounded-xl border border-zinc-800 items-center shadow-2xl overflow-hidden">
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
                                    placeholder="Enter system command..."
                                />
                                <button onClick={savePreset} disabled={!input} className="p-2 text-zinc-600 hover:text-indigo-400 transition-colors" title="Save as Preset"><Icon name="bookmark_add"/></button>
                                <button onClick={handleSend} disabled={!input || isThinking} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium flex items-center gap-2">
                                    <Icon name="send_spark" />
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            <div className="w-72 border-l border-white/5 bg-zinc-900/20 backdrop-blur hidden xl:flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Context</h3>
                </div>
                <div className="p-4 space-y-6">
                    <div>
                        <div className="text-[10px] text-zinc-500 mb-2 font-mono">REALTIME_METRICS</div>
                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-3">
                             <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-400"><span>VRAM</span> <span>{system.vramUsage.toFixed(1)}G</span></div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${(system.vramUsage/12)*100}%`}}></div></div>
                             </div>
                             <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-400"><span>TEMP</span> <span>{system.gpuTemp.toFixed(0)}°C</span></div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${(system.gpuTemp/100)*100}%`}}></div></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExplorerView = () => {
    const [path, setPath] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);

    const currentFolder = useMemo(() => {
        let folder = MOCK_FILES;
        for (const p of path) {
            const found = folder.find(f => f.name === p && f.type === 'folder');
            if (found && found.children) folder = found.children;
        }
        return folder;
    }, [path]);

    const selectedFile = useMemo(() => {
        if (!selected) return null;
        const findFile = (items: FileItem[]): FileItem | undefined => {
            for (const item of items) {
                if (item.id === selected) return item;
                if (item.children) {
                    const found = findFile(item.children);
                    if (found) return found;
                }
            }
        };
        return findFile(MOCK_FILES);
    }, [selected]);

    return (
        <div className="flex h-full animate-in fade-in duration-300">
            <div className="w-80 border-r border-white/5 bg-zinc-900/30 p-4 flex flex-col">
                <div className="mb-4 p-2 bg-zinc-950 rounded border border-zinc-800 flex items-center text-xs font-mono text-zinc-400 overflow-hidden">
                    <Icon name="home" size="text-xs" className="mr-2 text-indigo-500"/>
                    <button onClick={() => setPath([])} className="hover:text-white transition-colors">root</button>
                    {path.map((p, i) => (
                        <React.Fragment key={i}>
                            <span className="mx-1 text-zinc-600">/</span>
                            <span className="truncate">{p}</span>
                        </React.Fragment>
                    ))}
                </div>
                <div className="space-y-1">
                    {path.length > 0 && (
                         <button onClick={() => setPath(prev => prev.slice(0,-1))} className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 rounded flex items-center gap-2">
                             <Icon name="arrow_upward" size="text-xs"/> Up Level
                         </button>
                    )}
                    {currentFolder.map(f => (
                        <button 
                            key={f.id} 
                            onClick={() => f.type === 'folder' ? setPath([...path, f.name]) : setSelected(f.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-3 transition-all group ${selected === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <Icon 
                                name={f.type === 'folder' ? 'folder' : f.type === 'image' ? 'image' : f.type === 'model' ? 'extension' : f.type === 'video' ? 'movie' : 'description'} 
                                className={selected === f.id ? 'text-white' : f.type === 'folder' ? 'text-amber-400/80' : 'text-indigo-400/80'}
                            />
                            <span className="truncate flex-1">{f.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                 {selectedFile ? (
                     <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur text-center animate-in zoom-in-95 duration-200">
                         <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                             <Icon name="description" className="text-4xl text-zinc-500"/>
                         </div>
                         <h2 className="text-xl font-bold text-white mb-1 truncate">{selectedFile.name}</h2>
                         <div className="flex justify-center gap-4 text-xs text-zinc-500 mb-8 font-mono">
                             <span>{selectedFile.type.toUpperCase()}</span>
                             <span>{selectedFile.size || 'N/A'}</span>
                             <span>{selectedFile.date}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <Button variant="primary" icon="download">Load</Button>
                             <Button variant="secondary" icon="edit">Edit</Button>
                         </div>
                     </div>
                 ) : (
                     <div className="text-center opacity-20">
                         <Icon name="grid_view" className="text-8xl mb-4"/>
                         <p className="font-mono">NO SELECTION</p>
                     </div>
                 )}
            </div>
        </div>
    );
};

const WorkflowView = ({ loadFactorSetter }: { loadFactorSetter: (n: number) => void }) => {
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);

    const toggleWorkflow = useCallback((id: string) => {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'running', progress: 0 } : w));
        loadFactorSetter(2.5);

        let p = 0;
        const int = setInterval(() => {
            p += Math.random() * 15;
            if (p >= 100) {
                p = 100;
                clearInterval(int);
                setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'completed', progress: 100 } : w));
                loadFactorSetter(0.1);
            } else {
                setWorkflows(prev => prev.map(w => w.id === id ? { ...w, progress: p } : w));
            }
        }, 400);
    }, [loadFactorSetter]);

    const renderWorkflowCard = (wf: Workflow) => (
        <div key={wf.id} className={`bg-zinc-900/40 border rounded-xl p-6 relative overflow-hidden group transition-all ${wf.status === 'running' ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]' : 'border-white/5 hover:border-white/10'}`}>
             {wf.status === 'running' && (
                 <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300 ease-linear shadow-[0_0_10px_#6366f1]" style={{width: `${wf.progress}%`}}></div>
             )}
             <div className="flex justify-between items-start mb-4">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${wf.status === 'running' ? 'bg-indigo-600 text-white animate-pulse' : `bg-${wf.color}-500/10 text-${wf.color}-400`}`}>
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
                {wf.specs.models.map(m => <span key={m} className="px-1.5 py-0.5 rounded-sm bg-zinc-800 text-[9px] text-zinc-400 border border-zinc-700/50 truncate max-w-[100px]">{m}</span>)}
                {wf.specs.tools.map(t => <span key={t} className="px-1.5 py-0.5 rounded-sm bg-zinc-800 text-[9px] text-zinc-500 border border-zinc-700/50">{t}</span>)}
             </div>
             
             {wf.status === 'running' ? (
                 <div className="w-full py-2 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center gap-2 text-xs font-mono text-indigo-400">
                     <span className="animate-spin"><Icon name="sync"/></span> Processing {Math.floor(wf.progress)}%
                 </div>
             ) : (
                 <Button onClick={() => toggleWorkflow(wf.id)} variant={wf.status === 'completed' ? 'secondary' : 'primary'} className="w-full" icon={wf.status === 'completed' ? 'restart_alt' : 'play_arrow'}>
                     {wf.status === 'completed' ? 'Rerun' : wf.category === 'template' ? 'Launch Template' : 'Execute'}
                 </Button>
             )}
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
            <header className="mb-10">
                <h1 className="text-2xl font-bold text-white mb-2 font-mono">PIPELINE_MANAGER</h1>
                <p className="text-zinc-500 text-sm max-w-xl">Orchestrate automated tasks. Workflows consume VRAM resources while active.</p>
            </header>

            <div className="mb-10">
                 <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon name="grid_view" size="text-sm"/> Clickable Templates
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {workflows.filter(w => w.category === 'template').map(renderWorkflowCard)}
                 </div>
            </div>

            <div>
                 <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon name="settings_applications" size="text-sm"/> Utilities
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {workflows.filter(w => w.category === 'utility').map(renderWorkflowCard)}
                 </div>
            </div>
        </div>
    );
};

const BlenderView = ({ loadFactorSetter }: { loadFactorSetter: (n: number) => void }) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
    
    const generate = () => {
        setStatus('generating');
        loadFactorSetter(3.0);
        setTimeout(() => {
            setStatus('done');
            loadFactorSetter(0.1);
        }, 3500);
    };

    return (
        <div className="flex h-full animate-in fade-in duration-500">
            <div className="w-80 border-r border-white/5 bg-zinc-900/50 backdrop-blur p-6 flex flex-col z-10 shadow-2xl">
                <div className="mb-6 flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                    <Icon name="view_in_ar"/> 3D Synthesis Module
                </div>
                <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-sm text-white h-32 resize-none focus:border-indigo-500 outline-none transition-colors font-mono placeholder:text-zinc-700"
                            placeholder="Describe 3D asset..."
                        />
                    </div>
                    <Button onClick={generate} disabled={!prompt || status === 'generating'} className="w-full py-3" icon="auto_awesome" variant="primary">
                        {status === 'generating' ? 'Meshing...' : 'Generate'}
                    </Button>
                </div>
                {status === 'generating' && (
                    <div className="mt-4 p-3 bg-black/50 rounded border border-zinc-800 font-mono text-[10px] text-zinc-400 space-y-1">
                        <div className="text-emerald-500">&gt; init_point_cloud()</div>
                        <div className="text-zinc-500">&gt; generating_vertices...</div>
                        <div className="animate-pulse">&gt; texturing_uv_map</div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 bg-zinc-950 relative overflow-hidden perspective-1000 flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                    {status === 'idle' && (
                        <div className="text-center opacity-30">
                            <div className="w-32 h-32 border-2 border-dashed border-zinc-700 rounded-xl mx-auto mb-4 flex items-center justify-center">
                                <Icon name="cube" className="text-6xl"/>
                            </div>
                            <p className="font-mono text-zinc-500">VIEWPORT IDLE</p>
                        </div>
                    )}
                    {status === 'generating' && (
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
                            <div className="absolute inset-4 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-mono text-indigo-400 animate-pulse">SYNTHESIZING</div>
                        </div>
                    )}
                    {status === 'done' && (
                        <div className="animate-in zoom-in duration-500">
                            <div className="w-64 h-64 bg-gradient-to-tr from-zinc-800 to-zinc-900 rounded-xl shadow-2xl border border-white/10 flex items-center justify-center relative group cursor-move hover:scale-105 transition-transform duration-500">
                                <Icon name="extension" className="text-9xl text-zinc-200 drop-shadow-2xl"/>
                                <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/50 rounded-xl transition-all"></div>
                            </div>
                            <div className="mt-8 flex justify-center gap-4">
                                <Button icon="download" variant="secondary">OBJ</Button>
                                <Button icon="download" variant="secondary">GLB</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 6. MAIN APP COMPONENT ---

export default function VibeLocalOps() {
    const [view, setView] = useState<ViewMode>('dashboard');
    const { system, setSystem, addLog, setLoadFactor } = useSystemTelemetry();
    const [showExport, setShowExport] = useState(false);

    const handleSystemAction = useCallback((action: string) => {
        if (action === 'purge') {
            addLog('Purging VRAM cache...', 'warn');
            setSystem(prev => ({...prev, vramUsage: Math.max(1.5, prev.vramUsage * 0.4)}));
            setTimeout(() => addLog('Cache purge complete. VRAM freed.', 'info'), 1000);
        }
        if (action === 'update') {
            addLog('Checking git remote origin...', 'net');
            setTimeout(() => addLog('System is up to date.', 'info'), 1500);
        }
    }, [addLog, setSystem]);

    const handleAgentCommand = useCallback((cmd: string) => {
        if (cmd === '/clear') addLog('Agent history cleared via command.');
        else addLog(`Agent executed: ${cmd}`);
    }, [addLog]);

    return (
        <div className="h-screen w-screen flex bg-black text-zinc-200 overflow-hidden font-sans selection:bg-indigo-500/30">
            <Sidebar activeView={view} onViewChange={setView} />
            
            <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950 pointer-events-none"></div>
                
                <div className="relative z-10 h-full">
                    {view === 'dashboard' && <DashboardView system={system} onAction={handleSystemAction} />}
                    {view === 'explorer' && <ExplorerView />}
                    {view === 'workflows' && <WorkflowView loadFactorSetter={setLoadFactor} />}
                    {view === 'agent' && <AgentView system={system} onCommand={handleAgentCommand} />}
                    {view === 'blender' && <BlenderView loadFactorSetter={setLoadFactor} />}
                    
                    {view === 'settings' && (
                        <div className="p-12 flex justify-center animate-in fade-in">
                            <div className="max-w-2xl w-full space-y-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">System Config</h1>
                                    <p className="text-zinc-400">Manage deployment and local bridge settings.</p>
                                </div>
                                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur">
                                    <h3 className="text-xl font-bold text-white mb-4">Local Deployment Bridge</h3>
                                    <p className="text-zinc-400 mb-6 text-sm">Browser sandbox restrictions prevent direct hardware access.</p>
                                    <Button onClick={() => setShowExport(true)} variant="primary" className="w-full py-3">Export Source Code</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {showExport && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                            <h3 className="font-bold text-white">Source Code</h3>
                            <button onClick={() => setShowExport(false)} className="text-zinc-500 hover:text-white"><Icon name="close"/></button>
                        </div>
                        <div className="flex-1 p-4 bg-black overflow-hidden relative flex items-center justify-center">
                             <p className="text-zinc-500 text-center">
                                 Press <strong className="text-white">Ctrl+A</strong> to select all code in this file,<br/>then copy to your local project.
                             </p>
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-900">
                            <Button onClick={() => setShowExport(false)} variant="secondary">Done</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<VibeLocalOps />);
}
