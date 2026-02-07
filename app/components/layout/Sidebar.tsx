'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Typography,
    Divider,
    useTheme,
    alpha,
    Tooltip,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Analytics as AnalyticsIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Inventory2 as InventoryIcon,
    AccountBalance as BudgetIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    ExpandLess,
    ExpandMore,
    ChevronLeft,
    ChevronRight,
    School as SchoolIcon,
    Map as MapIcon,
    LocationCity as LocationCityIcon,
    Badge as BadgeIcon,
    SwapHoriz as TransferIcon,
    Devices as DevicesIcon,
    LocalShipping as ShippingIcon,
    PieChart as PieChartIcon,
    Receipt as ReceiptIcon,
    VerifiedUser as VerifiedIcon,
    Notifications as AnnouncementsIcon,
    ContactSupport as SupportIcon,
    Storage as BackupIcon,
    HealthAndSafety as HealthIcon,
    CalendarMonth as CalendarIcon,
    Assignment as SubjectIcon,
    Dns as SystemHealthIcon,
    SettingsSuggest as GlobalConfigIcon,
    AppRegistration as ModuleIcon,
    ManageAccounts as UserMgmtIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { moduleRegistry } from '@/app/lib/core';
import type { MenuItem as MenuItemType } from '@/app/lib/types';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
    Dashboard: <DashboardIcon />,
    Analytics: <AnalyticsIcon />,
    BarChart: <AnalyticsIcon />,
    Business: <BusinessIcon />,
    People: <PeopleIcon />,
    Inventory: <InventoryIcon />,
    Inventory2: <InventoryIcon />,
    AccountBalance: <BudgetIcon />,
    Assessment: <ReportsIcon />,
    Settings: <SettingsIcon />,
    School: <SchoolIcon />,
    Map: <MapIcon />,
    LocationCity: <LocationCityIcon />,
    Badge: <BadgeIcon />,
    SwapHoriz: <TransferIcon />,
    HowToReg: <BadgeIcon />,
    Devices: <DevicesIcon />,
    LocalShipping: <ShippingIcon />,
    PieChart: <PieChartIcon />,
    AccountTree: <BudgetIcon />,
    Receipt: <ReceiptIcon />,
    RequestQuote: <ReceiptIcon />,
    Description: <ReportsIcon />,
    Schedule: <ReportsIcon />,
    Tune: <SettingsIcon />,
    Security: <SettingsIcon />,
    Inbox: <InventoryIcon />,
    Notifications: <AnnouncementsIcon />,
    ContactSupport: <SupportIcon />,
    Storage: <BackupIcon />,
    HealthAndSafety: <HealthIcon />,
    CalendarMonth: <CalendarIcon />,
    Assignment: <SubjectIcon />,
    Dns: <SystemHealthIcon />,
    SettingsSuggest: <GlobalConfigIcon />,
    AppRegistration: <ModuleIcon />,
    ManageAccounts: <UserMgmtIcon />,
};

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const theme = useTheme();
    const pathname = usePathname();
    const hasPermission = useAuthStore(state => state.hasPermission);
    const user = useAuthStore(state => state.user);

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    // Handle hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper checking role directly from user object to avoidgetState issues in render
    const hasRole = (role: string) => {
        return user?.roles?.some(r => r.name === role) ?? false;
    };

    const isSystemAdmin = hasRole('SYSTEM_ADMIN');

    // Get menu items grouped by category
    const groupedMenuItems = useMemo(() => {
        const modules = moduleRegistry.getAll();
        const groups: Record<string, MenuItemType[]> = {};

        if (!user) return {};

        modules.forEach(m => {
            // SYSTEM_ADMIN bypasses module permission checks
            if (!isSystemAdmin && m.requiredPermission && !hasPermission(m.requiredPermission)) {
                return;
            }

            const visibleItems = m.menuItems.filter(item => {
                // SYSTEM_ADMIN sees all items
                if (isSystemAdmin) return true;

                // Permission check
                if (item.permission && !hasPermission(item.permission)) return false;

                // Tenant type check
                if (item.allowedTenantTypes && !item.allowedTenantTypes.includes(user.tenantType)) {
                    return false;
                }

                // Role check
                if (item.allowedRoles && item.allowedRoles.length > 0) {
                    const userHasRole = item.allowedRoles.some(role => hasRole(role));
                    if (!userHasRole) return false;
                }

                return true;
            });

            if (visibleItems.length > 0) {
                const category = m.category || 'Other';
                if (!groups[category]) groups[category] = [];
                groups[category].push(...visibleItems);
            }
        });

        return groups;
    }, [user, hasPermission, isSystemAdmin]);

    const handleToggleMenu = (menuId: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId],
        }));
    };

    if (!mounted) return null;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const renderMenuItem = (item: MenuItemType, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openMenus[item.id] ?? false;
        const active = isActive(item.path);

        const visibleChildren = item.children?.filter(child => {
            // SYSTEM_ADMIN bypass
            if (isSystemAdmin) return true;

            if (child.permission && !hasPermission(child.permission)) return false;

            if (child.allowedTenantTypes && user && !child.allowedTenantTypes.includes(user.tenantType)) {
                return false;
            }

            if (child.allowedRoles && child.allowedRoles.length > 0) {
                const userHasRole = child.allowedRoles.some(role => hasRole(role));
                if (!userHasRole) return false;
            }
            return true;
        });

        // If item has children but none are visible, hide parent (unless parent is a link itself)
        if (hasChildren && (!visibleChildren || visibleChildren.length === 0) && !item.path) {
            return null;
        }

        return (
            <React.Fragment key={item.id}>
                <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                    <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                        <ListItemButton
                            component={hasChildren ? 'div' : Link}
                            href={hasChildren ? undefined : item.path}
                            onClick={hasChildren ? () => handleToggleMenu(item.id) : undefined}
                            sx={{
                                minHeight: 48,
                                px: 2,
                                borderRadius: '12px',
                                mx: 1.5,
                                transition: 'all 0.2s ease-in-out',
                                backgroundColor: active
                                    ? alpha(theme.palette.primary.main, 0.1)
                                    : 'transparent',
                                color: active
                                    ? theme.palette.primary.main
                                    : theme.palette.text.secondary,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    transform: 'translateX(4px)',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: collapsed ? 0 : 2,
                                    justifyContent: 'center',
                                    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                                    transition: 'color 0.2s',
                                }}
                            >
                                {item.icon ? iconMap[item.icon] || <DashboardIcon /> : <DashboardIcon />}
                            </ListItemIcon>
                            {!collapsed && (
                                <>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: active ? 700 : 500,
                                            noWrap: true,
                                        }}
                                    />
                                    {item.badge && (
                                        <Box
                                            sx={{
                                                ml: 1,
                                                px: 0.8,
                                                py: 0.2,
                                                borderRadius: '6px',
                                                backgroundColor: theme.palette.error.main,
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.4)}`,
                                            }}
                                        >
                                            {item.badge}
                                        </Box>
                                    )}
                                    {hasChildren && (
                                        <Box sx={{ color: theme.palette.text.disabled, ml: 1 }}>
                                            {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                        </Box>
                                    )}
                                </>
                            )}
                        </ListItemButton>
                    </Tooltip>
                </ListItem>

                {hasChildren && !collapsed && visibleChildren && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {visibleChildren.map(child => renderMenuItem(child, depth + 1))}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        );
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                },
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2.5, mb: 1, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
                {!collapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 42, height: 42, borderRadius: '12px',
                            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.25)}`,
                        }}>
                            <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5, lineHeight: 1 }}>
                                Tigray EDU
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: 0.5 }}>
                                Portal
                            </Typography>
                        </Box>
                    </Box>
                )}
                <IconButton onClick={onToggle} sx={{
                    backgroundColor: alpha(theme.palette.action.hover, 0.05),
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                }}>
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
            </Box>

            <Divider sx={{ mx: 2, mb: 2, opacity: 0.5 }} />

            {/* Navigation Sections */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
                {Object.entries(groupedMenuItems).map(([category, items]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                        {!collapsed && (
                            <Typography
                                variant="overline"
                                sx={{
                                    px: 3,
                                    mb: 1,
                                    display: 'block',
                                    fontWeight: 700,
                                    color: theme.palette.text.disabled,
                                    letterSpacing: 1.2,
                                }}
                            >
                                {category}
                            </Typography>
                        )}
                        <List disablePadding>
                            {items.map(item => renderMenuItem(item))}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* User Profile */}
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: '16px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    overflow: 'hidden',
                }}>
                    <Avatar
                        sx={{
                            width: 42,
                            height: 42,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '1rem',
                            fontWeight: 700,
                        }}
                    >
                        {user?.firstName?.charAt(0)}
                    </Avatar>
                    {!collapsed && (
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                    label={user?.tenantType?.toUpperCase() || 'USER'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{
                                        height: 16,
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        borderRadius: '4px',
                                        '& .MuiChip-label': { px: 0.5 }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '11px' }}>
                                    {user?.tenantName}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
}

export default Sidebar;
