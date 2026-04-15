import React, { useState, useEffect, useRef } from 'react';
import { SystemTelemetry, AgentMessage, Preset } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Icon from '../components/Icon';

interface AgentViewProps {
    system: SystemTelemetry;
    onCommand: (cmd: string) => void;
}

const AgentView = ({ system, onCommand }: AgentViewProps) => {
    const [history, setHistory] = useLocalStorage<AgentMessage[]>('vibe_agent_history', []);
    const [presets, setPresets] = useLocalStorage<Preset[]>('vibe_presets', []);
    const [input, setInput] = useState('');
    const [isThinking, setThinking] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isThinking]);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            snapshot: { vram: system.vramUsage.toFixed(1), temp: system.gpuTemp.toFixed(1) },
        };

        setHistory((prev) => [...prev, userMsg]);
        setInput('');
        setThinking(true);

        if (input.startsWith('/')) {
            setTimeout(() => {
                const responseId = crypto.randomUUID();
                const responseText = `Executing system directive: ${input}`;
                if (input === '/clear') {
                    setHistory([]);
                    setThinking(false);
                    return;
                }
                setHistory((prev) => [
                    ...prev,
                    { id: responseId, role: 'ai', text: responseText, timestamp: new Date().toLocaleTimeString() },
                ]);
                setThinking(false);
                onCommand(input);
            }, 600);
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    vram: system.vramUsage.toFixed(1),
                    temp: system.gpuTemp.toFixed(1),
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`Proxy responded with HTTP ${response.status}`);
            }

            const aiMsgId = crypto.randomUUID();
            setHistory((prev) => [
                ...prev,
                { id: aiMsgId, role: 'ai', text: '', timestamp: new Date().toLocaleTimeString() },
            ]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            outer: while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                for (const line of decoder.decode(value).split('\n')) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6);
                    if (payload === '[DONE]') break outer;
                    try {
                        const { text, error } = JSON.parse(payload);
                        if (error) throw new Error(error);
                        if (text) {
                            fullText += text;
                            setHistory((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, text: fullText } : m)));
                        }
                    } catch (parseErr) {
                        console.warn('[AgentView] Malformed SSE chunk:', parseErr);
                    }
                }
            }
        } catch (e) {
            console.error('[AgentView] Proxy error:', e);
            setHistory((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'ai',
                    text: 'CONNECTION_ERROR: Neural link unstable.',
                    timestamp: new Date().toLocaleTimeString(),
                },
            ]);
        } finally {
            setThinking(false);
        }
    };

    const savePreset = () => {
        if (!input) return;
        setPresets((prev) => [
            ...prev,
            { id: crypto.randomUUID(), label: input.substring(0, 12) + '...', command: input },
        ]);
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
                            <Icon name="smart_toy" className="text-8xl mb-4 text-zinc-700" />
                            <p className="font-mono text-sm text-zinc-500">AWAITING INPUT SEQUENCE</p>
                        </div>
                    )}
                    {history.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full group`}
                        >
                            <div className="flex items-center gap-2 mb-1 px-1 opacity-40 text-[10px] font-mono">
                                <span className="uppercase font-bold">{msg.role === 'user' ? 'OP_01' : 'CORE_AI'}</span>
                                <span>{msg.timestamp}</span>
                            </div>
                            <div
                                className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-lg border max-w-[85%] ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-100 rounded-tr-sm backdrop-blur-sm'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                {msg.snapshot && (
                                    <div className="mt-2 pt-2 border-t border-white/5 flex gap-3 text-[10px] font-mono text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Icon name="memory" size="text-[12px]" /> {msg.snapshot.vram}G
                                        </span>
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
                                {presets.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setInput(p.command)}
                                        className="flex-shrink-0 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-400 rounded-md transition-colors flex items-center gap-2 group"
                                    >
                                        {p.label}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPresets((prev) => prev.filter((x) => x.id !== p.id));
                                            }}
                                            className="hover:text-rose-400 opacity-0 group-hover:opacity-100"
                                        >
                                            <Icon name="close" size="text-[10px]" />
                                        </span>
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
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
                                    placeholder="Enter system command..."
                                />
                                <button
                                    onClick={savePreset}
                                    disabled={!input}
                                    className="p-2 text-zinc-600 hover:text-indigo-400 transition-colors"
                                    title="Save as Preset"
                                >
                                    <Icon name="bookmark_add" />
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!input || isThinking}
                                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium flex items-center gap-2"
                                >
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
                                <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>VRAM</span> <span>{system.vramUsage.toFixed(1)}G</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-1000"
                                        style={{ width: `${(system.vramUsage / 12) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>TEMP</span> <span>{system.gpuTemp.toFixed(0)}°C</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${(system.gpuTemp / 100) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentView;
