import React from 'react';
import { ViewMode } from '../types';
import Icon from './Icon';

interface SidebarProps {
    activeView: ViewMode;
    onViewChange: (v: ViewMode) => void;
}

const Sidebar = React.memo(({ activeView, onViewChange }: SidebarProps) => {
    const navItems = [
        { id: 'dashboard', icon: 'grid_view', label: 'Overview' },
        { id: 'explorer', icon: 'folder_open', label: 'Files' },
        { id: 'workflows', icon: 'hub', label: 'Pipelines' },
        { id: 'agent', icon: 'smart_toy', label: 'Neural Link' },
        { id: 'blender', icon: 'deployed_code', label: '3D Forge' },
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
                        {activeView === item.id && (
                            <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>
                        )}
                        <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-zinc-200 text-[10px] font-bold uppercase rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50 translate-x-[-10px] group-hover:translate-x-0">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={() => onViewChange('settings')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
                <Icon name="settings" />
            </button>
        </nav>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
