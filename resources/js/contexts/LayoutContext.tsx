import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type LayoutPosition = 'left' | 'right';
export type Direction = 'ltr' | 'rtl';

type LayoutContextType = {
    direction: Direction;
    effectivePosition: LayoutPosition;
    isRtl: boolean;
    setDirection: (dir: Direction) => void; // Optional external setter
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
    children?: ReactNode;
    globalSettings?: any; // passed from app.tsx
}

export const LayoutProvider = ({ children, globalSettings }: LayoutProviderProps) => {
    const initialDirection: Direction = globalSettings?.layout_direction === 'rtl' ? 'rtl' : 'ltr';

    const [direction, setDirectionState] = useState<Direction>(initialDirection);

    // Stable setter that avoids unnecessary state updates
    const setDirection = useCallback((dir: Direction) => {
        setDirectionState((prev) => (prev === dir ? prev : dir));
    }, []);

    // Sync with <html dir> and listen for external mutations
    useEffect(() => {
        const updateDir = () => {
            const docDir: Direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
            setDirection(docDir);
        };

        // Initialize HTML dir
        document.documentElement.dir = direction;

        const observer = new MutationObserver(updateDir);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });

        return () => {
            observer.disconnect();
        };
    }, [direction, setDirection]);

    // Memoized derived values to prevent re-renders
    const isRtl = useMemo(() => direction === 'rtl', [direction]);
    const effectivePosition = useMemo<LayoutPosition>(() => (isRtl ? 'right' : 'left'), [isRtl]);

    const contextValue = useMemo(() => ({ direction, effectivePosition, isRtl, setDirection }), [direction, effectivePosition, isRtl, setDirection]);

    return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>;
};

/**
 * Access layout direction and derived positioning.
 * Throws if used outside LayoutProvider.
 */
export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) throw new Error('useLayout must be used within LayoutProvider');
    return context;
};
