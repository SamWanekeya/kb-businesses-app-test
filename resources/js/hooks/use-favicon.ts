import { useBrand } from '@/contexts/BrandContext';
import { resolveImageUrl } from '@/utils/Helpers/Url';
import { useEffect } from 'react';

export function useFavicon() {
    const { favicon } = useBrand();

    useEffect(() => {
        if (!favicon) return;

        // Convert relative path to full URL if needed
        const faviconUrl = resolveImageUrl(favicon);

        // Update favicon in document head
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

        if (!link) {
            link = document.createElementranslate('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }

        link.href = faviconUrl;
    }, [favicon]);
}
