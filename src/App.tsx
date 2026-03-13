import React, { useState, useCallback } from 'react';
import { ViewMode } from './types';
import { useSystemTelemetry } from './hooks/useSystemTelemetry';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import AgentView from './views/AgentView';
import ExplorerView from './views/ExplorerView';
import WorkflowView from './views/WorkflowView';
import BlenderView from './views/BlenderView';
import SettingsView from './views/SettingsView';
import Icon from './components/Icon';
import Button from './components/Button';

export default function App() {
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
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950 pointer-events-none"></div>

                <div className="relative z-10 h-full">
                    {view === 'dashboard' && <DashboardView system={system} onAction={handleSystemAction} />}
                    {view === 'explorer' && <ExplorerView />}
                    {view === 'workflows' && <WorkflowView loadFactorSetter={setLoadFactor} />}
                    {view === 'agent' && <AgentView system={system} onCommand={handleAgentCommand} />}
                    {view === 'blender' && <BlenderView loadFactorSetter={setLoadFactor} />}
                    {view === 'settings' && <SettingsView onExport={() => setShowExport(true)} />}
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
