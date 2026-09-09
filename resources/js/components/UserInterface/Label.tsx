import * as LabelPrimitive from '@radix-ui/react-label';
import React from 'react';

import { cn } from '@lib/utils';

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
    required?: boolean;
}

export default function Label({ className, required, children, ...props }: LabelProps) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                'text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                className,
            )}
            {...props}
        >
            {children}
            {required && <span className="ml-1 text-red-600">*</span>}
        </LabelPrimitive.Root>
    );
}

export { Label };
