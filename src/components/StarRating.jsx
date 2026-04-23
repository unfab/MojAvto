import React from 'react';

const SIZE_MAP = { sm: 14, md: 18, lg: 24 };
const GAP_MAP = { sm: 1, md: 2, lg: 3 };

function Star({ fill, size, index }) {
    const dim = SIZE_MAP[size] || 18;
    const color = fill === 'empty' ? '#374151' : 'var(--color-primary-start, #f59e0b)';
    const gradId = `star-half-${index}`;

    if (fill === 'half') {
        return (
            <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={gradId}>
                        <stop offset="50%" stopColor="var(--color-primary-start, #f59e0b)" />
                        <stop offset="50%" stopColor="#374151" />
                    </linearGradient>
                </defs>
                <polygon
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                    fill={`url(#${gradId})`}
                />
            </svg>
        );
    }

    return (
        <svg width={dim} height={dim} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={color}
            />
        </svg>
    );
}

export default function StarRating({ stars, size = 'md', showLabel = true, label }) {
    const gap = GAP_MAP[size] || 2;

    const starEls = [];
    for (let i = 1; i <= 5; i++) {
        const fill = stars >= i ? 'full' : stars >= i - 0.5 ? 'half' : 'empty';
        starEls.push(<Star key={i} fill={fill} size={size} index={i} />);
    }

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: gap * 2 + 'px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: gap + 'px' }}>
                {starEls}
            </div>
            {showLabel && label && (
                <span style={{
                    fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.85rem',
                    color: 'var(--color-primary-start, #f59e0b)',
                    fontWeight: 600,
                }}>
                    {label}
                </span>
            )}
        </div>
    );
}
