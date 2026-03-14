import React from 'react';

interface IconProps {
    name: string;
    className?: string;
    size?: string;
}

const Icon = React.memo(({ name, className, size = 'text-base' }: IconProps) => (
    <span className={`material-symbols-outlined select-none ${size} ${className || ''}`} aria-hidden="true">
        {name}
    </span>
));

Icon.displayName = 'Icon';

export default Icon;
