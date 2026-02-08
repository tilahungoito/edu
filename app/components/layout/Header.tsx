'use client';

import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    InputBase,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
    Language as LanguageIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
    const theme = useTheme();
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        router.push('/login');
    };

    const drawerWidth = sidebarCollapsed ? 72 : 280;

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: `calc(100% - ${drawerWidth}px)`,
                ml: `${drawerWidth}px`,
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
                {/* Search Bar */}
                <Box
                    className="glass-effect"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 3,
                        px: 2,
                        py: 0.8,
                        width: 450,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:focus-within': {
                            width: 500,
                            borderColor: theme.palette.secondary.main,
                            boxShadow: `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                    }}
                >
                    <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                    <InputBase
                        placeholder="Quick search across system..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            '& input::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 0.7,
                            },
                        }}
                    />
                    <Box
                        sx={{
                            ml: 1,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.text.secondary, 0.05),
                            border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                            color: theme.palette.text.secondary,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                        }}
                    >
                        ⌘K
                    </Box>
                </Box>

                {/* Right Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Language Toggle */}
                    <Tooltip title="Language">
                        <IconButton
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                },
                            }}
                        >
                            <LanguageIcon sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                    </Tooltip>

                    {/* Theme Toggle */}
                    <Tooltip title="Toggle theme">
                        <IconButton
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                },
                            }}
                        >
                            <LightModeIcon sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Notifications">
                        <IconButton
                            onClick={handleNotificationOpen}
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                },
                            }}
                        >
                            <Badge badgeContent={4} color="error">
                                <NotificationsIcon sx={{ color: theme.palette.text.secondary }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    {/* User Profile */}
                    {mounted && user && (
                        <Box
                            onClick={handleProfileMenuOpen}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                p: 1,
                                borderRadius: 2,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                },
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: theme.palette.primary.main,
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                }}
                            >
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                    {user?.firstName} {user?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user?.tenantType === 'bureau' ? 'Bureau Admin' :
                                        user?.tenantType === 'zone' ? 'Zone Admin' :
                                            user?.tenantType === 'woreda' ? 'Woreda Admin' :
                                                user?.tenantType === 'kebele' ? 'Kebele Admin' : 'School Admin'}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Profile Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            minWidth: 200,
                            mt: 1.5,
                            borderRadius: 2,
                            '& .MuiMenuItem-root': {
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                mx: 1,
                                my: 0.5,
                            },
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }}>
                        <ListItemIcon>
                            <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        My Profile
                    </MenuItem>
                    <MenuItem>
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        Settings
                    </MenuItem>
                    <Divider sx={{ my: 1 }} />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <Typography color="error">Logout</Typography>
                    </MenuItem>
                </Menu>

                {/* Notifications Menu */}
                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            width: 360,
                            maxHeight: 400,
                            mt: 1.5,
                            borderRadius: 2,
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Notifications
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                mb: 1,
                            }}
                        >
                            <Typography variant="body2" fontWeight={500}>
                                New transfer request
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                A staff transfer request is waiting for approval
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.warning.main, 0.08),
                                mb: 1,
                            }}
                        >
                            <Typography variant="body2" fontWeight={500}>
                                Budget request pending
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                3 budget requests need your attention
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.success.main, 0.08),
                            }}
                        >
                            <Typography variant="body2" fontWeight={500}>
                                Report generated
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Monthly report is ready for download
                            </Typography>
                        </Box>
                    </Box>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
