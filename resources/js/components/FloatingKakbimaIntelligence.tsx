import { useEffect, useState } from 'react';

import KakbimaIntelligenceModal from '@components/KakbimaIntelligence/KakbimaIntelligenceModal';
import { Button } from '@components/UserInterface/Button';
import { usePage } from '@inertiajs/react';
import { Brain } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export default function FloatingKakbimaIntelligence() {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    // Check if user can access Kakbima Intelligence
    const isSuperAdmin = auth?.user?.type === 'super_admin';
    const isOrganization = auth?.user?.type === 'organization';

    let canUseKakbimaIntelligence = false;

    if (isSuperAdmin) {
        canUseKakbimaIntelligence = true;
    } else if (isOrganization) {
        // For organization users, check their own plan
        const hasActivePlan = auth?.user?.is_plan_active === 1 && auth?.user?.plan;
        canUseKakbimaIntelligence = hasActivePlan && auth?.user?.plan?.enable_kakbima_intelligence === 'on';
    } else {
        // For other users, check the plan of the organization user who created them
        const creator = auth?.user?.creator;
        const hasActivePlan = creator?.is_plan_active === 1 && creator?.plan;
        canUseKakbimaIntelligence = hasActivePlan && creator?.plan?.enable_kakbima_intelligence === 'on';
    }

    // Don’t render if user doesn’t have access
    if (!canUseKakbimaIntelligence) {
        return null;
    }

    useEffect(() => {}, [isOpen]);

    const handleGenerate = (content: string) => {
        setGeneratedContent(content);
        // You can add additional logic here if needed
    };

    const handleModalOpen = () => {
        setIsOpen(true);
    };

    const handleModalClose = () => {
        setIsOpen(false);
    };

    return createPortal(
        <>
            <div
                className="pointer-events-auto fixed bottom-6 z-[80000] ltr:right-6 rtl:left-6"
                data-kakbima-intelligence-button="data-kakbima-intelligence-button"
                style={{ pointerEvents: 'auto', zIndex: 80000 }}
                onClickCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleModalOpen();
                }}
                onMouseDownCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleModalOpen();
                    }}
                    className="pointer-events-auto rounded-full shadow-lg transition-shadow hover:shadow-xl"
                    size="lg"
                    data-kakbima-intelligence-button
                    style={{ pointerEvents: 'auto' }}
                >
                    <Brain className="h-32 w-32" />
                </Button>
            </div>

            <KakbimaIntelligenceModal isOpen={isOpen} onClose={handleModalClose} onGenerate={handleGenerate} title={translate('Kakbima Intelligence')} />
        </>,
        document.body,
    );
}
