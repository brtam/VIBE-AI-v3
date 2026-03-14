import { useState, useEffect, useRef, useCallback } from 'react';
import { SystemTelemetry, LogEntry } from '../types';
import { INITIAL_SYSTEM_STATE } from '../data/mocks';

export function useSystemTelemetry() {
    const [system, setSystem] = useState<SystemTelemetry>(INITIAL_SYSTEM_STATE);
    const loadFactorRef = useRef(0.1);

    const setLoadFactor = useCallback((factor: number) => {
        loadFactorRef.current = factor;
    }, []);

    const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            message: msg,
            type,
        };
        setSystem((prev) => ({ ...prev, logs: [...prev.logs.slice(-29), entry] }));
    }, []);

    useEffect(() => {
        if (!system.isSimulated) return;
        const interval = setInterval(() => {
            setSystem((prev) => {
                const lf = loadFactorRef.current;
                let newVram = prev.vramUsage + (Math.random() - 0.45) * lf;
                newVram = Math.max(1.5, Math.min(prev.vramTotal - 0.2, newVram));

                let newTemp = prev.gpuTemp + (Math.random() - 0.4) * (lf * 2);
                newTemp = Math.max(35, Math.min(88, newTemp));

                return {
                    ...prev,
                    vramUsage: newVram,
                    gpuTemp: newTemp,
                    ramUsage: Math.max(4, Math.min(prev.ramTotal, prev.ramUsage + (Math.random() - 0.5) * 0.2)),
                };
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [system.isSimulated]);

    return { system, setSystem, addLog, setLoadFactor };
}
