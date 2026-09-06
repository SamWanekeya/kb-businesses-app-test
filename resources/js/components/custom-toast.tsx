import { Toaster } from '@/components/ui/sonner';
import { router } from '@inertiajs/react';
import { toast as sonnerToast } from 'sonner';

const demoModeMessage = 'This action is disabled in demo mode. You can only create new data, not modify existing demo data.';

// Override router methods
const originalPut = router.put;
const originalDelete = router.delete;
const originalPatch = router.patch;

router.put = function (url: string, data?: any, options?: any) {
    return originalPut.call(this, url, data, options);
};

router.delete = function (url: string, options?: any) {
    return originalDelete.call(this, url, options);
};

router.patch = function (url: string, data?: any, options?: any) {
    return originalPatch.call(this, url, data, options);
};

export const toast = {
    ...sonnerToast,
    loading: (message: string, options?: any) => {
        return sonnerToast.loading(message, options);
    },
};

export const CustomToast = () => {
    return <Toaster position="top-right" duration={4000} richColors closeButton />;
};
