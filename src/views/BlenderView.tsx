import React, { useState } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';

interface BlenderViewProps {
    loadFactorSetter: (n: number) => void;
}

const BlenderView = ({ loadFactorSetter }: BlenderViewProps) => {
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

export default BlenderView;
