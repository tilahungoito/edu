import React, { useEffect, useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Divider,
    IconButton,
    Badge,
    Paper
} from '@mui/material';
import { AddComment as AddCommentIcon, Search as SearchIcon } from '@mui/icons-material';
import { useChatStore } from '@/app/lib/store/chat-store';
import { useAuthStore } from '@/app/lib/store/auth-store';
import UserSearchDialog from './UserSearchDialog';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList() {
    const { conversations, loadConversations, selectConversation, activeConversationId } = useChatStore();
    const { user } = useAuthStore();
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const getConversationName = (conversation: any) => {
        if (conversation.type === 'group' && conversation.name) return conversation.name;
        const other = conversation.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
        return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email || 'Unknown' : 'Unknown';
    };

    const getAvatar = (conversation: any) => {
        const other = conversation.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
        const profilePicture = other?.profilePicture;
        if (!profilePicture) return undefined;
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '');
        const cleanPath = profilePicture.startsWith('/') ? profilePicture : '/' + profilePicture;
        return `${baseUrl}${cleanPath}`;
    };

    const getOtherUser = (conversation: any) => {
        return conversation.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
    };

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'relative'
        }}>
            {/* Glass Header */}
            <Box sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="h5" fontWeight={800} sx={{
                    background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    Chats
                </Typography>
                <IconButton
                    onClick={() => setSearchOpen(true)}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                    }}
                    size="small"
                >
                    <AddCommentIcon fontSize="small" />
                </IconButton>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', py: 1, px: 1.5 }}>
                {conversations.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
                    </Box>
                ) : (
                    conversations.map((conv) => {
                        const isSelected = activeConversationId === conv.id;
                        const otherUser = getOtherUser(conv);
                        const initials = getConversationName(conv).split(' ').map((n: string) => n[0]).join('');

                        return (
                            <ListItem key={conv.id} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => selectConversation(conv.id)}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&.Mui-selected': {
                                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.12)' },
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            color="primary"
                                            variant="dot"
                                            invisible={true} // Logic for unread exists?
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        >
                                            <Avatar
                                                src={getAvatar(conv)}
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    boxShadow: isSelected ? '0 0 0 2px #1976d2' : 'none',
                                                    transition: 'all 0.2s',
                                                    bgcolor: 'primary.light'
                                                }}
                                            >
                                                {initials}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                                <Typography variant="subtitle1" fontWeight={isSelected ? 700 : 600} noWrap sx={{ maxWidth: '140px' }}>
                                                    {getConversationName(conv)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }) : ''}
                                                </Typography>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ component: 'div' }}
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color={isSelected ? 'text.primary' : 'text.secondary'}
                                                noWrap
                                                sx={{
                                                    mt: 0.2,
                                                    fontSize: '0.825rem',
                                                    fontWeight: conv.messages?.[0]?.isRead === false && conv.messages[0].senderId !== user?.id ? 700 : 400
                                                }}
                                            >
                                                {conv.messages?.[0]?.content || 'Start a conversation'}
                                            </Typography>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                        sx={{ ml: 0.5 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })
                )}
            </List>

            <UserSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Box>
    );
}
