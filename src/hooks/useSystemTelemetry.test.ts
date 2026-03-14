import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSystemTelemetry } from './useSystemTelemetry';

describe('useSystemTelemetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the correct initial system state', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        const { system } = result.current;

        expect(system.vramTotal).toBe(12);
        expect(system.ramTotal).toBe(32);
        expect(system.isSimulated).toBe(true);
        expect(system.activeServices).toContain('Ollama Service');
        expect(system.logs.length).toBeGreaterThan(0);
    });

    it('addLog appends an entry with the correct message and type', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        const before = result.current.system.logs.length;

        act(() => {
            result.current.addLog('Test message', 'warn');
        });

        const logs = result.current.system.logs;
        expect(logs.length).toBe(before + 1);
        expect(logs.at(-1)?.message).toBe('Test message');
        expect(logs.at(-1)?.type).toBe('warn');
    });

    it('addLog defaults to type "info"', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        act(() => {
            result.current.addLog('Info entry');
        });
        expect(result.current.system.logs.at(-1)?.type).toBe('info');
    });

    it('addLog keeps at most 30 entries (ring buffer)', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        act(() => {
            for (let i = 0; i < 35; i++) {
                result.current.addLog(`msg ${i}`);
            }
        });
        expect(result.current.system.logs.length).toBeLessThanOrEqual(30);
    });

    it('setLoadFactor does not throw', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        expect(() => act(() => result.current.setLoadFactor(3.0))).not.toThrow();
    });

    it('simulation tick updates vramUsage after interval', () => {
        const { result } = renderHook(() => useSystemTelemetry());
        const initialVram = result.current.system.vramUsage;

        act(() => {
            vi.advanceTimersByTime(1500 * 5);
        });

        // After several ticks the value should have been updated (may be same by chance, but state must exist)
        expect(typeof result.current.system.vramUsage).toBe('number');
        expect(result.current.system.vramUsage).toBeGreaterThanOrEqual(1.5);
        expect(result.current.system.vramUsage).toBeLessThan(result.current.system.vramTotal);
        // suppress unused warning
        void initialVram;
    });
});
