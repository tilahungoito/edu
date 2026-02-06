'use client';

import { useAuthStore } from '@/app/lib/store';

export function useScopedData<T extends any>(data: T[], type: 'zone' | 'woreda' | 'school' | 'staff' | 'inventory' | 'budget'): T[] {
    const user = useAuthStore(state => state.user);

    if (!user || user.tenantType === 'bureau') {
        return data;
    }

    const { tenantType, tenantId } = user;

    return data.filter((item: any) => {
        // Handle based on item type and user tenant level
        switch (type) {
            case 'zone':
                // Zone users only see their own zone
                if (tenantType === 'zone') return item.id === tenantId;
                // Woreda/School users shouldn't even see the zone list, but if they do, only their parent
                return false;

            case 'woreda':
                if (tenantType === 'zone') return item.zoneId === tenantId;
                if (tenantType === 'woreda') return item.id === tenantId;
                return false;

            case 'school':
                if (tenantType === 'zone') return item.zoneId === tenantId;
                if (tenantType === 'woreda') return item.woredaId === tenantId;
                if (tenantType === 'school') return item.id === tenantId;
                return false;

            case 'staff':
            case 'inventory':
            case 'budget':
                if (tenantType === 'zone') return item.zoneId === tenantId;
                if (tenantType === 'woreda') return item.woredaId === tenantId;
                if (tenantType === 'school') return item.schoolId === tenantId;
                return false;

            default:
                return true;
        }
    });
}
