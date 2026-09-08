import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ModalStackContextType {
    registerModal: (id: string) => number;
    unregisterModal: (id: string) => void;
    getZIndex: (id: string) => number;
    modalStack: string[];
}

const ModalStackContext = createContext<ModalStackContextType | undefined>(undefined);

export function ModalStackProvider({ children }: { children: React.ReactNode }) {
    const [modalStack, setModalStack] = useState<string[]>([]);
    const baseZIndex = 50;

    const registerModal = useCallback((id: string) => {
        let index = 0;
        setModalStack((prev) => {
            if (prev.includes(id)) {
                index = prev.indexOf(id);
                return prev;
            }
            index = prev.length;
            return [...prev, id];
        });
        return baseZIndex + index;
    }, []);

    const unregisterModal = useCallback((id: string) => {
        setModalStack((prev) => prev.filter((modalId) => modalId !== id));
    }, []);

    const getZIndex = useCallback(
        (id: string) => {
            const index = modalStack.indexOf(id);
            return index >= 0 ? baseZIndex + index : baseZIndex;
        },
        [modalStack],
    );

    // Memoize the entire context to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            registerModal,
            unregisterModal,
            getZIndex,
            modalStack,
        }),
        [registerModal, unregisterModal, getZIndex, modalStack],
    );

    return <ModalStackContext.Provider value={contextValue}>{children}</ModalStackContext.Provider>;
}

export function useModalStack() {
    const context = useContext(ModalStackContext);
    if (!context) {
        throw new Error('useModalStack must be used within a ModalStackProvider');
    }
    return context;
}
