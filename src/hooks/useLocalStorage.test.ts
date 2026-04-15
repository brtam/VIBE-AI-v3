import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('returns initial value when key does not exist', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
        expect(result.current[0]).toBe('default');
    });

    it('reads existing value from localStorage on mount', () => {
        localStorage.setItem('test-key', JSON.stringify('stored'));
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
        expect(result.current[0]).toBe('stored');
    });

    it('stores a new value in localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
        act(() => {
            result.current[1]('updated');
        });
        expect(result.current[0]).toBe('updated');
        expect(localStorage.getItem('test-key')).toBe('"updated"');
    });

    it('supports functional updates', () => {
        const { result } = renderHook(() => useLocalStorage('count', 0));
        act(() => {
            result.current[1]((prev) => prev + 5);
        });
        expect(result.current[0]).toBe(5);
    });

    it('returns initial value when localStorage contains invalid JSON', () => {
        localStorage.setItem('test-key', 'not-valid-json{{{');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
        expect(result.current[0]).toBe('fallback');
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('works with array values', () => {
        const { result } = renderHook(() => useLocalStorage<string[]>('arr', []));
        act(() => {
            result.current[1](['a', 'b']);
        });
        expect(result.current[0]).toEqual(['a', 'b']);
    });
});
