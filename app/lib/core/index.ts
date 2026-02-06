export { moduleRegistry, type ModuleConfig } from './module-registry';
export {
    PermissionGate,
    RequirePermission,
    ModuleGate,
    usePermission,
    useModuleAccess,
    useCanPerformAction,
    useAllPermissions,
} from './permission-guard';
export {
    TenantProvider,
    TenantBoundary,
    useTenant,
    withTenantScope,
} from './tenant-context';
