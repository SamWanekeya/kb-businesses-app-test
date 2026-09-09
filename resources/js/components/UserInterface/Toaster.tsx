// resources/js/components/UserInterface/Toaster.tsx

import { ReactNode } from 'react';

export interface ToasterProps {
    children?: ReactNode;
}

export default function Toaster({ children }: ToasterProps) {
    return <div className="fixed top-0 right-0 z-50 w-full max-w-xs space-y-4 p-4">{children}</div>;
}
