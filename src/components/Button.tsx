import React from 'react';
import Icon from './Icon';

export interface ButtonProps {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    className?: string;
    disabled?: boolean;
    icon?: string;
    title?: string;
}

const Button = React.memo(
    ({ children, onClick, variant = 'primary', className, disabled, icon, title }: ButtonProps) => {
        const baseStyle =
            'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
        const variants: Record<string, string> = {
            primary:
                'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.25)] border border-indigo-500/50',
            secondary:
                'bg-zinc-800/50 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700 backdrop-blur-sm',
            danger: 'bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/50',
            ghost: 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white',
        };
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${baseStyle} ${variants[variant]} ${className}`}
                title={title}
            >
                {icon && <Icon name={icon} />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
