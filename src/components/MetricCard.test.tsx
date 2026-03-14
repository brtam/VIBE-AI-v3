import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MetricCard from './MetricCard';

describe('MetricCard', () => {
    it('renders the label', () => {
        render(<MetricCard label="VRAM Usage" val={6} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('VRAM Usage')).toBeInTheDocument();
    });

    it('renders the value with one decimal place', () => {
        render(<MetricCard label="VRAM" val={6} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('6.0')).toBeInTheDocument();
    });

    it('renders the unit', () => {
        render(<MetricCard label="VRAM" val={6} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('GB')).toBeInTheDocument();
    });

    it('renders the correct percentage', () => {
        render(<MetricCard label="VRAM" val={6} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('clamps percentage to 100% when val exceeds max', () => {
        render(<MetricCard label="VRAM" val={20} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('clamps percentage to 0% when val is negative', () => {
        render(<MetricCard label="VRAM" val={-5} max={12} unit="GB" color="indigo" />);
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('rounds percentage to nearest integer', () => {
        render(<MetricCard label="Temp" val={75} max={100} unit="°C" color="emerald" />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });
});
