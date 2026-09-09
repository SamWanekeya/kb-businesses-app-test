// resources/js/components/UserInterface/toaster.tsx
import React from 'react';

export interface ToasterProps {
    children?: React.ReactNode;
}

export function Toaster({ children }: ToasterProps) {
    return <div className="fixed top-0 right-0 z-50 w-full max-w-xs space-y-4 p-4">{children}</div>;
}

export function Toast({ message }: { message: string }) {
    return <div className="rounded-md border bg-white p-4 shadow-lg">{message}</div>;
}
