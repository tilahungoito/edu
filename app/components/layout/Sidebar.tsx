'use client';

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { moduleRegistry } from '@/app/lib/core';
import type { MenuItem as MenuItemType } from '@/app/lib/types';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

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
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Get menu items from module registry, filtered by permissions
    const modules = moduleRegistry.getAll();

    const menuItems = modules
        .filter(m => hasPermission(m.requiredPermission))
        .flatMap(m => m.menuItems)
        .filter(item => {
            // Check permission
            if (item.permission && !hasPermission(item.permission)) return false;

            // Check if tenant type is allowed
            if (item.allowedTenantTypes && user && !item.allowedTenantTypes.includes(user.tenantType)) {
                return false;
            }

            return true;
        });

    const handleToggleMenu = (menuId: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId],
        }));
    };

    if (!mounted) {
        return (
            <Drawer
                variant="permanent"
                sx={{
                    width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRight: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        overflowX: 'hidden',
                    },
                }}
            />
        );
    }

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const renderMenuItem = (item: MenuItemType, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openMenus[item.id] ?? false;
        const active = isActive(item.path);

        // Filter children by permission and tenant type
        const visibleChildren = item.children?.filter(child => {
            if (child.permission && !hasPermission(child.permission)) return false;
            if (child.allowedTenantTypes && user && !child.allowedTenantTypes.includes(user.tenantType)) {
                return false;
            }
            return true;
        });

        return (
            <React.Fragment key={item.id}>
                <ListItem disablePadding sx={{ display: 'block' }}>
                    <Tooltip
                        title={collapsed ? item.label : ''}
                        placement="right"
                        arrow
                    >
                        <ListItemButton
                            component={hasChildren ? 'div' : Link}
                            href={hasChildren ? undefined : item.path}
                            onClick={hasChildren ? () => handleToggleMenu(item.id) : undefined}
                            sx={{
                                minHeight: 48,
                                px: 2.5,
                                pl: collapsed ? 2.5 : 2.5 + depth * 2,
                                borderRadius: 2,
                                mx: 1,
                                mb: 0.5,
                                backgroundColor: active
                                    ? alpha(theme.palette.primary.main, 0.12)
                                    : 'transparent',
                                color: active
                                    ? theme.palette.primary.main
                                    : theme.palette.text.secondary,
                                '&:hover': {
                                    backgroundColor: active
                                        ? alpha(theme.palette.primary.main, 0.16)
                                        : alpha(theme.palette.primary.main, 0.08),
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: collapsed ? 0 : 2,
                                    justifyContent: 'center',
                                    color: 'inherit',
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
                                            fontWeight: active ? 600 : 500,
                                        }}
                                    />
                                    {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                                    {item.badge && (
                                        <Box
                                            sx={{
                                                ml: 1,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                backgroundColor: theme.palette.error.main,
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {item.badge}
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
                    borderRight: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                },
            }}
        >
            {/* Logo and Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    px: 2,
                    py: 2,
                    minHeight: 64,
                }}
            >
                {!collapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SchoolIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                Tigray EDU
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Management System
                            </Typography>
                        </Box>
                    </Box>
                )}
                <IconButton onClick={onToggle} size="small">
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
            </Box>

            <Divider />

            {/* User Info */}
            {user && !collapsed && (
                <Box sx={{ px: 2, py: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                            {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user.tenantName}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Navigation */}
            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                <List>
                    {menuItems.map(item => renderMenuItem(item))}
                </List>
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
                {!collapsed && (
                    <Typography variant="caption" color="text.disabled">
                        Tigray Education Bureau -v1.0
                    </Typography>
                )}
            </Box>
        </Drawer>
    );
}

export default Sidebar;
