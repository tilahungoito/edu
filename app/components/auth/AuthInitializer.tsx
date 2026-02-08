'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/app/lib/store/auth-store';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
    const initialize = useAuthStore(state => state.initialize);
    const isInitialized = useAuthStore(state => state.isInitialized);

    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [initialize, isInitialized]);

    return <>{children}</>;
}
