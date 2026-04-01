'use client';

import React, { useState, useEffect } from 'react';
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
    CircularProgress,
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
    Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { useThemeStore } from '@/app/lib/store/theme-store';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import announcementsService, { Announcement } from '@/app/lib/api/announcements.service';
import { notificationsService } from '@/app/lib/api/notifications.service';
import { searchService, SearchResult } from '@/app/lib/api/search.service';

interface Notification {
    id: string;
    title: string;
    content: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface HeaderProps {
    sidebarCollapsed: boolean;
    onMenuClick?: () => void;
}

export function Header({ sidebarCollapsed, onMenuClick }: HeaderProps) {
    const theme = useTheme();
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const { mode, toggleTheme } = useThemeStore();
    const queryClient = useQueryClient();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
    const [mounted, setMounted] = useState(false);

    const { data: unreadAnnouncements } = useQuery({
        queryKey: ['announcements', 'unread-count'],
        queryFn: () => announcementsService.getUnreadCount(),
        refetchInterval: 30000, 
        enabled: !!user,
    });

    const { data: unreadNotifications } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsService.getUnreadCount(),
        refetchInterval: 30000,
        enabled: !!user,
    });

    const totalUnreadCount = (unreadAnnouncements?.unreadCount || 0) + (unreadNotifications?.unreadCount || 0);

    const { data: announcements = [] } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => announcementsService.getAll(),
        refetchInterval: 60000, 
        enabled: Boolean(notificationAnchor), 
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getAll(),
        refetchInterval: 60000,
        enabled: Boolean(notificationAnchor),
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => announcementsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
        }
    });

    const markNotificationAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        }
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchValue.length >= 2) {
                setSearchLoading(true);
                const results = await searchService.search(searchValue);
                setSearchResults(results);
                setSearchLoading(false);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchValue]);

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

    const handleAnnouncementClick = (announcement: Announcement) => {
        if (!announcement.isRead) {
            markAsReadMutation.mutate(announcement.id);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) {
            markNotificationAsReadMutation.mutate(notif.id);
        }
        if (notif.link) {
            router.push(notif.link);
        }
        handleNotificationClose();
    };

    const drawerWidth = sidebarCollapsed ? 80 : 280;

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
                ml: { xs: 0, md: `${drawerWidth}px` },
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
                {/* Mobile Menu Icon */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { md: 'none' }, color: theme.palette.text.primary }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Search Bar */}
                <Box
                    className="glass-effect"
                    sx={{
                        display: { xs: 'none', sm: 'flex' },
                        alignItems: 'center',
                        borderRadius: 3,
                        px: 2,
                        py: 0.8,
                        width: { xs: '100%', sm: 300, md: 450 },
                        maxWidth: '100%',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:focus-within': {
                            width: { xs: '100%', sm: 350, md: 500 },
                            borderColor: theme.palette.secondary.main,
                            boxShadow: `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                    }}
                >
                    <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                    <InputBase
                        placeholder="Quick search across system..."
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setSearchAnchor(e.currentTarget);
                        }}
                        onFocus={(e) => setSearchAnchor(e.currentTarget)}
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

                    {/* Search Results Dropdown */}
                    <Menu
                        anchorEl={searchAnchor}
                        open={Boolean(searchValue.length >= 2 && searchAnchor)}
                        onClose={() => setSearchAnchor(null)}
                        autoFocus={false}
                        disablePortal
                        PaperProps={{
                            sx: {
                                width: 450,
                                mt: 1,
                                borderRadius: 3,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                border: `1px solid ${theme.palette.divider}`,
                                maxHeight: 400,
                            }
                        }}
                    >
                        {searchLoading ? (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((result) => (
                                <MenuItem 
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => {
                                        router.push(result.path);
                                        setSearchValue('');
                                        setSearchAnchor(null);
                                    }}
                                    sx={{ py: 1.5, px: 2 }}
                                >
                                    <ListItemIcon>
                                        <Badge badgeContent={result.type} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16 } }}>
                                            <SearchIcon fontSize="small" />
                                        </Badge>
                                    </ListItemIcon>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>{result.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">{result.description}</Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No results found for "{searchValue}"</Typography>
                            </Box>
                        )}
                    </Menu>
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
                            <Badge badgeContent={totalUnreadCount} color="error">
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
                                src={user?.profilePicture ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '')}${user.profilePicture.startsWith('/') ? user.profilePicture : '/' + user.profilePicture}` : undefined}
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
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                    {user?.roles?.[0]?.name?.toLowerCase().replace('_', ' ') || 'User'}
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
                    <MenuItem onClick={toggleTheme}>
                        <ListItemIcon>
                            {mode === 'light' ? (
                                <DarkModeIcon fontSize="small" />
                            ) : (
                                <LightModeIcon fontSize="small" />
                            )}
                        </ListItemIcon>
                        {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </MenuItem>
                    <Divider sx={{ my: 1 }} />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <Typography color="error">Logout</Typography>
                    </MenuItem>
                </Menu>

                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            width: 380,
                            maxHeight: 500,
                            mt: 1.5,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            System Inbox
                        </Typography>
                        {totalUnreadCount > 0 && (
                             <Typography variant="caption" sx={{ bgcolor: 'error.main', color: 'white', px: 1, borderRadius: 1, fontWeight: 700 }}>
                                 {totalUnreadCount} NEW
                             </Typography>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                        {/* PERSONAL NOTIFICATIONS (HIGHER PRIORITY) */}
                        {notifications.length > 0 && (
                             <Box sx={{ mb: 2 }}>
                                 <Typography variant="overline" color="text.secondary" sx={{ px: 1, fontWeight: 800 }}>Recent Alerts</Typography>
                                 {notifications.slice(0, 5).map((notif: Notification) => (
                                     <Box
                                         key={notif.id}
                                         onClick={() => handleNotificationClick(notif)}
                                         sx={{
                                             p: 1.5,
                                             borderRadius: 2,
                                             backgroundColor: notif.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.06),
                                             mb: 0.5,
                                             cursor: 'pointer',
                                             transition: 'all 0.2s',
                                             borderLeft: notif.isRead ? '3px solid transparent' : `3px solid ${theme.palette.primary.main}`,
                                             '&:hover': {
                                                 backgroundColor: alpha(theme.palette.action.hover, 0.1),
                                             }
                                         }}
                                     >
                                         <Typography variant="subtitle2" fontWeight={notif.isRead ? 600 : 800} color={notif.isRead ? 'text.secondary' : 'text.primary'}>
                                             {notif.title}
                                         </Typography>
                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                             {notif.content}
                                         </Typography>
                                         <Typography variant="caption" color="primary" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                                             {new Date(notif.createdAt).toLocaleDateString()}
                                         </Typography>
                                     </Box>
                                 ))}
                             </Box>
                        )}

                        {/* SYSTEM ANNOUNCEMENTS */}
                        <Typography variant="overline" color="text.secondary" sx={{ px: 1, fontWeight: 800 }}>Announcements</Typography>
                        {announcements.length > 0 ? (
                            announcements.slice(0, 3).map((announcement) => (
                                <Box
                                    key={announcement.id}
                                    onClick={() => handleAnnouncementClick(announcement)}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: announcement.isRead
                                            ? 'transparent'
                                            : alpha(theme.palette.secondary.main, 0.06),
                                        mb: 0.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderLeft: announcement.isRead ? '3px solid transparent' : `3px solid ${theme.palette.secondary.main}`,
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.action.hover, 0.1),
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={announcement.isRead ? 600 : 800}>
                                        {announcement.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                                        {announcement.content}
                                    </Typography>
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                                No announcements.
                            </Typography>
                        )}
                    </Box>

                    {/* Footer Actions */}
                    <Box sx={{ p: 1.5, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="caption" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 800 }}>
                            VIEW ALL NOTIFICATIONS
                        </Typography>
                    </Box>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
