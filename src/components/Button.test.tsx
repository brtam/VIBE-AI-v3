import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('is disabled when the disabled prop is true', () => {
        render(<Button disabled>Locked</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(
            <Button onClick={handleClick} disabled>
                Locked
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders an icon when the icon prop is provided', () => {
        render(<Button icon="check">With Icon</Button>);
        expect(document.querySelector('.material-symbols-outlined')).toBeInTheDocument();
    });

    it('applies primary variant classes by default', () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('from-indigo-600');
    });

    it('applies secondary variant classes when variant="secondary"', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-zinc-800');
    });

    it('applies danger variant classes when variant="danger"', () => {
        render(<Button variant="danger">Delete</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('rose');
    });

    it('forwards the title attribute', () => {
        render(<Button title="tooltip text">Btn</Button>);
        expect(screen.getByTitle('tooltip text')).toBeInTheDocument();
    });
});
