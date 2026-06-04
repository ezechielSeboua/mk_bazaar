import Icon from './Icon';

export function HeartIcon({ className = 'w-5 h-5' }) {
    return (
        <Icon className={className} fill="currentColor" stroke="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </Icon>
    );
}

export function SpinnerIcon({ className = 'w-5 h-5 animate-spin' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

export function PlaceholderImageIcon({ className = 'w-16 h-16 text-stone-300' }) {
    return (
        <Icon className={className} strokeWidth={1.5}>
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <circle cx="8.5" cy="10" r="2.5" />
            <path d="M21 15l-4-4-8 8-3-2" />
        </Icon>
    );
}

export function ErrorIcon({ className = 'w-5 h-5' }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </Icon>
    );
}

export const SelectChevronIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const selectChevronStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.75rem center',
};
