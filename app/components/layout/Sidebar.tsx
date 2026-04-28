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
    Chat as ChatIcon,
    ContentCopy as ContentCopyIcon,
    Groups as GroupsIcon,
    TrendingUp as TrendingUpIcon,
    History as HistoryIcon,
    SupportAgent as SupportAgentIcon,
    AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { moduleRegistry } from '@/app/lib/core';
import type { MenuItem as MenuItemType } from '@/app/lib/types';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

// Icon configuration with natural colors
const iconConfig: Record<string, { icon: React.ReactNode, color: string }> = {
    Dashboard: { icon: <DashboardIcon />, color: '#6366f1' }, // Indigo
    Analytics: { icon: <AnalyticsIcon />, color: '#f59e0b' }, // Amber
    BarChart: { icon: <AnalyticsIcon />, color: '#f59e0b' },
    Business: { icon: <BusinessIcon />, color: '#3b82f6' }, // Blue
    People: { icon: <PeopleIcon />, color: '#10b981' }, // Emerald
    Inventory: { icon: <InventoryIcon />, color: '#8b5cf6' }, // Violet
    Inventory2: { icon: <InventoryIcon />, color: '#8b5cf6' },
    AccountBalance: { icon: <BudgetIcon />, color: '#06b6d4' }, // Cyan
    Assessment: { icon: <ReportsIcon />, color: '#f43f5e' }, // Rose
    Settings: { icon: <SettingsIcon />, color: '#64748b' }, // Slate
    School: { icon: <SchoolIcon />, color: '#3b82f6' },
    Map: { icon: <MapIcon />, color: '#10b981' },
    LocationCity: { icon: <LocationCityIcon />, color: '#3b82f6' },
    Badge: { icon: <BadgeIcon />, color: '#6366f1' },
    SwapHoriz: { icon: <TransferIcon />, color: '#ec4899' }, // Pink
    HowToReg: { icon: <BadgeIcon />, color: '#10b981' },
    Devices: { icon: <DevicesIcon />, color: '#64748b' },
    LocalShipping: { icon: <ShippingIcon />, color: '#f59e0b' },
    PieChart: { icon: <PieChartIcon />, color: '#06b6d4' },
    Receipt: { icon: <ReceiptIcon />, color: '#10b981' },
    RequestQuote: { icon: <ReceiptIcon />, color: '#f59e0b' },
    Description: { icon: <ReportsIcon />, color: '#3b82f6' },
    Schedule: { icon: <ReportsIcon />, color: '#6366f1' },
    Tune: { icon: <SettingsIcon />, color: '#64748b' },
    Security: { icon: <SettingsIcon />, color: '#f43f5e' },
    Inbox: { icon: <InventoryIcon />, color: '#3b82f6' },
    Notifications: { icon: <AnnouncementsIcon />, color: '#f59e0b' },
    ContactSupport: { icon: <SupportIcon />, color: '#06b6d4' },
    Storage: { icon: <BackupIcon />, color: '#64748b' },
    HealthAndSafety: { icon: <HealthIcon />, color: '#f43f5e' },
    CalendarMonth: { icon: <CalendarIcon />, color: '#6366f1' },
    Assignment: { icon: <SubjectIcon />, color: '#8b5cf6' },
    Dns: { icon: <SystemHealthIcon />, color: '#10b981' },
    SettingsSuggest: { icon: <GlobalConfigIcon />, color: '#3b82f6' },
    AppRegistration: { icon: <ModuleIcon />, color: '#f59e0b' },
    ManageAccounts: { icon: <UserMgmtIcon />, color: '#6366f1' },
    Chat: { icon: <ChatIcon />, color: '#ec4899' },
    ContentCopy: { icon: <ContentCopyIcon />, color: '#8b5cf6' },
    Groups: { icon: <GroupsIcon />, color: '#10b981' },
    TrendingUp: { icon: <TrendingUpIcon />, color: '#10b981' },
    History: { icon: <HistoryIcon />, color: '#64748b' },
    SupportAgent: { icon: <SupportAgentIcon />, color: '#06b6d4' },
    AccountTree: { icon: <AccountTreeIcon />, color: '#8b5cf6' },
    VerifiedUser: { icon: <VerifiedIcon />, color: '#10b981' },
};

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    variant?: 'permanent' | 'temporary' | 'persistent';
    open?: boolean;
    onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, variant = 'permanent', open = true, onClose }: SidebarProps) {
    const theme = useTheme();
    const pathname = usePathname();
    const hasPermission = useAuthStore(state => state.hasPermission);
    const user = useAuthStore(state => state.user);

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    // Handle hydration + auto-open the active category
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-open the category that contains the current route
    useEffect(() => {
        if (!mounted) return;
        const modules = moduleRegistry.getAll();
        const activeCategories: Record<string, boolean> = {};
        modules.forEach(m => {
            const hasActive = m.menuItems.some(item =>
                item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))
            );
            if (hasActive && m.category) {
                activeCategories[m.category] = true;
            }
        });
        // Open active categories; keep others closed by default
        setOpenCategories(prev => ({ ...prev, ...activeCategories }));
    }, [mounted, pathname]);

    const handleToggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    // Helper checking role directly from user object to avoidgetState issues in render
    const hasRole = (role: string) => {
        const normalizedRole = role.toUpperCase();
        return user?.roles?.some(r => (r.name || '').toUpperCase() === normalizedRole) ?? false;
    };

    const isSystemAdmin = hasRole('SYSTEM_ADMIN');

    // Get menu items grouped by category
    const groupedMenuItems = useMemo(() => {
        const modules = moduleRegistry.getAll();
        const groups: Record<string, MenuItemType[]> = {};

        if (!user) return {};

        modules.forEach(m => {
            // Don't block at module level - let item-level filtering determine visibility
            // This allows role-based access to work correctly

            const visibleItems = m.menuItems.filter(item => {
                // SYSTEM_ADMIN sees all items
                if (isSystemAdmin) return true;

                // Tenant type check first (if specified)
                if (item.allowedTenantTypes && !item.allowedTenantTypes.includes(user.tenantType)) {
                    return false;
                }

                // Role check - if allowedRoles is specified and user has one of them, allow access
                const hasMatchingRole = item.allowedRoles && item.allowedRoles.length > 0
                    ? item.allowedRoles.some(role => hasRole(role))
                    : false;

                if (hasMatchingRole) return true;

                // Fall back to permission check if role check didn't pass or wasn't specified
                if (item.permission && hasPermission(item.permission)) return true;

                // If neither role nor permission granted access, but one was required, deny
                if (item.allowedRoles?.length || item.permission) return false;

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
        const active = item.path ? isActive(item.path) : false;

        const visibleChildren = item.children?.filter(child => {
            // SYSTEM_ADMIN bypass
            if (isSystemAdmin) return true;

            // Tenant type check
            if (child.allowedTenantTypes && user && !child.allowedTenantTypes.includes(user.tenantType)) {
                return false;
            }

            // Role check - Role match grants access
            const hasMatchingRole = child.allowedRoles && child.allowedRoles.length > 0
                ? child.allowedRoles.some(role => hasRole(role))
                : false;

            if (hasMatchingRole) return true;

            // Fallback to permission check
            if (child.permission && hasPermission(child.permission)) return true;

            // If neither granted access, but one was required, deny
            if (child.allowedRoles?.length || child.permission) return false;

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
                                    color: active ? theme.palette.primary.main : (item.icon ? iconConfig[item.icon]?.color || theme.palette.text.secondary : theme.palette.text.secondary),
                                    transition: 'all 0.2s',
                                    '& .MuiSvgIcon-root': {
                                        fontSize: 20,
                                        filter: active ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
                                    }
                                }}
                            >
                                {item.icon ? iconConfig[item.icon]?.icon || <DashboardIcon /> : <DashboardIcon />}
                            </ListItemIcon>
                            {!collapsed && (
                                <>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.8125rem',
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
            variant={variant}
            open={open}
            onClose={onClose}
            sx={{
                width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    borderRight: variant === 'temporary' ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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

            {/* Navigation Sections — collapsible categories */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
                {Object.entries(groupedMenuItems).map(([category, items]) => {
                    const isCategoryOpen = collapsed ? true : (openCategories[category] ?? false);
                    // Check if any item in this category is active
                    const categoryHasActive = items.some(item =>
                        item.path && (pathname === item.path || pathname.startsWith(item.path + '/'))
                    );

                    return (
                        <Box key={category} sx={{ mb: 0.5 }}>
                            {/* Category Header — clickable, only in expanded mode */}
                            {!collapsed && (
                                <ListItemButton
                                    onClick={() => handleToggleCategory(category)}
                                    sx={{
                                        borderRadius: '10px',
                                        mx: 1,
                                        my: 0.25,
                                        py: 0.6,
                                        px: 1.5,
                                        minHeight: 32,
                                        transition: 'all 0.15s',
                                        bgcolor: categoryHasActive
                                            ? alpha(theme.palette.primary.main, 0.06)
                                            : 'transparent',
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            flex: 1,
                                            fontWeight: 800,
                                            fontSize: '9px',
                                            letterSpacing: 1.5,
                                            color: categoryHasActive
                                                ? theme.palette.primary.main
                                                : theme.palette.text.disabled,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {category}
                                    </Typography>
                                    <Box sx={{
                                        color: theme.palette.text.disabled,
                                        display: 'flex',
                                        transition: 'transform 0.2s ease',
                                        transform: isCategoryOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    }}>
                                        <ExpandMore sx={{ fontSize: 16 }} />
                                    </Box>
                                </ListItemButton>
                            )}

                            {/* Items — collapse/expand smoothly */}
                            <Collapse in={isCategoryOpen} timeout={160} unmountOnExit>
                                <List disablePadding sx={{ mb: 0.5 }}>
                                    {items.map(item => renderMenuItem(item))}
                                </List>
                            </Collapse>
                        </Box>
                    );
                })}
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
                        src={user?.profilePicture ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '')}${user.profilePicture.startsWith('/') ? user.profilePicture : '/' + user.profilePicture}` : undefined}
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
