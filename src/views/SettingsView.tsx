import React from 'react';
import Button from '../components/Button';

interface SettingsViewProps {
    onExport: () => void;
}

const SettingsView = ({ onExport }: SettingsViewProps) => (
    <div className="p-12 flex justify-center animate-in fade-in">
        <div className="max-w-2xl w-full space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">System Config</h1>
                <p className="text-zinc-400">Manage deployment and local bridge settings.</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur">
                <h3 className="text-xl font-bold text-white mb-4">Local Deployment Bridge</h3>
                <p className="text-zinc-400 mb-6 text-sm">
                    Browser sandbox restrictions prevent direct hardware access.
                </p>
                <Button onClick={onExport} variant="primary" className="w-full py-3">
                    Export Source Code
                </Button>
            </div>
        </div>
    </div>
);

export default SettingsView;
