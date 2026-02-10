import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    ListItemButton,
    InputAdornment,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { useChatStore } from '@/app/lib/store/chat-store';
import api from '@/app/lib/api/api-client';

interface UserSearchDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function UserSearchDialog({ open, onClose }: UserSearchDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const createConversation = useChatStore(state => state.createConversation);
    const { user: currentUser } = useAuthStore();

    React.useEffect(() => {
        if (open) {
            fetchInitialUsers();
        } else {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [open]);

    const fetchInitialUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users?take=10');
            const users = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
            setSearchResults(users.filter((u: any) => u.id !== currentUser?.id));
        } catch (error) {
            console.error('Failed to fetch initial users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            fetchInitialUsers();
            return;
        }

        if (query.length < 2) return;

        setLoading(true);
        try {
            const response = await api.get(`/users?search=${query}`);
            const users = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
            setSearchResults(users.filter((u: any) => u.id !== currentUser?.id));
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = async (userId: string) => {
        try {
            await createConversation([userId], 'direct');
            onClose();
        } catch (error) {
            console.error('Failed to create conversation', error);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1 }}>New Message</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Search by name or email"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="primary" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '15px' }
                    }}
                    sx={{ mb: 3, mt: 1 }}
                />

                {loading && (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress size={30} />
                    </Box>
                )}

                <List sx={{ pt: 0 }}>
                    {searchQuery.length === 0 && searchResults.length > 0 && (
                        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 700 }}>
                            Suggested Users
                        </Typography>
                    )}
                    {searchResults.map((user) => (
                        <ListItem key={user.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => handleSelectUser(user.id)}
                                sx={{
                                    borderRadius: '12px',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)', transform: 'translateX(5px)' }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={user.profilePicture ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '')}${user.profilePicture.startsWith('/') ? user.profilePicture : '/' + user.profilePicture}` : undefined}
                                        alt={user.firstName || 'User'}
                                        sx={{ bgcolor: 'secondary.light' }}
                                    >
                                        {user.firstName ? user.firstName[0] : '?'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                                    secondary={user.email || 'No email provided'}
                                    primaryTypographyProps={{ fontWeight: 600 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No users found for "{searchQuery}"
                            </Typography>
                        </Box>
                    )}
                    {!loading && searchQuery.length > 0 && searchQuery.length < 2 && (
                        <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Type at least 2 characters to search
                            </Typography>
                        </Box>
                    )}
                    {!loading && searchQuery.length === 0 && searchResults.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                            <Typography variant="body2" color="text.secondary">
                                No users available to message
                            </Typography>
                        </Box>
                    )}
                </List>
            </DialogContent>
        </Dialog>
    );
}
