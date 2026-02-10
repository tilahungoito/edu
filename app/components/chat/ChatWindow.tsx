import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    IconButton,
    TextField,
    InputAdornment,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useChatStore } from '@/app/lib/store/chat-store';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { format } from 'date-fns';

export default function ChatWindow() {
    const { activeConversationId, conversations, messages, sendMessage, uploadFile, socket } = useChatStore();
    const { user } = useAuthStore();
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const currentMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages, activeConversationId]);

    const handleSend = async () => {
        if (!newMessage.trim() && !selectedFile) return;

        try {
            setIsUploading(true);
            let attachmentUrl = undefined;
            let type: 'text' | 'image' | 'file' = 'text';

            if (selectedFile) {
                const result = await uploadFile(selectedFile);
                attachmentUrl = result.url;
                type = selectedFile.type.startsWith('image/') ? 'image' : 'file';
            }

            const content = newMessage.trim() || (selectedFile ? selectedFile.name : '');
            await sendMessage(content, type, attachmentUrl);

            setNewMessage('');
            setSelectedFile(null);
            setFilePreview(null);
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
    };

    if (!activeConversation) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                bgcolor: '#f8fbfc',
                textAlign: 'center',
                p: 3
            }}>
                <Box
                    sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'background.default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        opacity: 0.5
                    }}
                >
                    <SendIcon sx={{ fontSize: 60, color: 'primary.main', transform: 'rotate(-45deg)' }} />
                </Box>
                <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                    Select a Conversation
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 300 }}>
                    Choose a contact from the list or start a new message to begin chatting.
                </Typography>
            </Box>
        );
    }

    const getConversationName = () => {
        if (activeConversation.type === 'group' && activeConversation.name) return activeConversation.name;
        const other = activeConversation.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
        return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email || 'User' : 'System';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f0f2f5' }}>
            {/* Professional Glass Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid',
                borderColor: 'divider',
                zIndex: 10
            }}>
                <Avatar
                    src={(() => {
                        const other = activeConversation.participants?.find((p: any) => p.user?.id !== user?.id)?.user;
                        if (!other?.profilePicture) return undefined;
                        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '');
                        const cleanPath = other.profilePicture.startsWith('/') ? other.profilePicture : '/' + other.profilePicture;
                        return `${baseUrl}${cleanPath}`;
                    })()}
                    sx={{
                        mr: 2,
                        width: 44,
                        height: 44,
                        bgcolor: 'primary.main',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {getConversationName()[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                        {getConversationName()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.2 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', mr: 1 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Online</Typography>
                    </Box>
                </Box>
                <IconButton size="small" sx={{ mr: 1 }}>
                    <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Messages Area with Modern Bubble System */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: 0.5
            }}>
                <div ref={messagesEndRef} />
                {(() => {
                    const reversedMessages = currentMessages.slice().reverse();
                    return reversedMessages.map((msg, index) => {
                        const isOwn = msg.senderId === user?.id;
                        const nextMsg = reversedMessages[index - 1];
                        const prevMsg = reversedMessages[index + 1];

                        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                        const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                        return (
                            <Box
                                key={msg.id || index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                    mb: isLastInGroup ? 2 : 0.5,
                                    alignItems: 'flex-end'
                                }}
                            >
                                {!isOwn && isLastInGroup && (
                                    <Avatar
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            mr: 1,
                                            mb: 2.5,
                                            fontSize: '0.8rem',
                                            bgcolor: 'secondary.main'
                                        }}
                                        src={(() => {
                                            const profilePicture = msg.sender?.profilePicture;
                                            if (!profilePicture) return undefined;
                                            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api').replace('/api', '').replace(/\/$/, '');
                                            const cleanPath = profilePicture.startsWith('/') ? profilePicture : '/' + profilePicture;
                                            return `${baseUrl}${cleanPath}`;
                                        })()}
                                    >
                                        {msg.sender?.firstName?.[0]}
                                    </Avatar>
                                )}
                                {!isOwn && !isLastInGroup && <Box sx={{ width: 36 }} />}

                                <Box sx={{ maxWidth: '75%', position: 'relative' }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            px: 2,
                                            borderRadius: isOwn
                                                ? (isFirstInGroup ? '20px 20px 4px 20px' : '20px 4px 4px 20px')
                                                : (isFirstInGroup ? '20px 20px 20px 4px' : '4px 20px 20px 4px'),
                                            background: isOwn
                                                ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                                                : '#ffffff',
                                            color: isOwn ? 'white' : 'text.primary',
                                            boxShadow: isOwn
                                                ? '0 4px 12px rgba(30, 60, 114, 0.15)'
                                                : '0 2px 6px rgba(0,0,0,0.05)',
                                            border: isOwn ? 'none' : '1px solid rgba(0,0,0,0.02)',
                                            ...(isLastInGroup && isFirstInGroup && {
                                                borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
                                            })
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '0.925rem' }}>
                                            {msg.content}
                                        </Typography>
                                        {msg.attachmentUrl && (
                                            <Box sx={{ mt: 1, mb: 0.5 }}>
                                                {msg.type === 'image' ? (
                                                    <Box
                                                        component="img"
                                                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:7000'}${msg.attachmentUrl}`}
                                                        sx={{
                                                            maxWidth: '100%',
                                                            maxHeight: 300,
                                                            borderRadius: 1,
                                                            display: 'block',
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}
                                                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:7000'}${msg.attachmentUrl}`, '_blank')}
                                                    />
                                                ) : (
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                                                            borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'divider',
                                                            color: isOwn ? 'white' : 'inherit',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }
                                                        }}
                                                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:7000'}${msg.attachmentUrl}`, '_blank')}
                                                    >
                                                        <AttachFileIcon fontSize="small" />
                                                        <Typography variant="caption" sx={{ textDecoration: 'underline', wordBreak: 'break-all' }}>
                                                            {msg.content}
                                                        </Typography>
                                                    </Paper>
                                                )}
                                            </Box>
                                        )}
                                    </Paper>

                                    {isLastInGroup && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                mt: 0.5,
                                                display: 'block',
                                                fontSize: '0.65rem',
                                                textAlign: isOwn ? 'right' : 'left',
                                                px: 0.5,
                                                opacity: 0.8
                                            }}
                                        >
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                            {isOwn && msg.isRead && ' • Read'}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    });
                })()}
            </Box>

            {/* Attachment Preview Section */}
            {selectedFile && (
                <Box sx={{
                    p: 1.5,
                    px: 3,
                    bgcolor: 'background.paper',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <style>
                        {`
                        @keyframes slideUp {
                            from { transform: translateY(100%); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                        `}
                    </style>
                    {filePreview ? (
                        <Box sx={{ position: 'relative', width: 50, height: 50 }}>
                            <img
                                src={filePreview}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                            />
                        </Box>
                    ) : (
                        <Box sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '8px',
                            bgcolor: 'rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FileIcon color="primary" />
                        </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap fontWeight={600} sx={{ color: 'text.primary' }}>
                            {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={removeSelectedFile} disabled={isUploading} sx={{ color: 'text.secondary' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Premium Pill-Style Input Area */}
            <Box sx={{ p: 2, bgcolor: 'transparent' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 0.5,
                        pl: 1.5,
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        bgcolor: 'background.paper'
                    }}
                >
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <IconButton
                        size="small"
                        sx={{ color: 'text.secondary' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <CircularProgress size={20} /> : <AttachFileIcon fontSize="small" />}
                    </IconButton>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        variant="standard"
                        placeholder="Write a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        InputProps={{
                            disableUnderline: true,
                            sx: { px: 1.5, py: 1, fontSize: '0.925rem' }
                        }}
                    />
                    <IconButton
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            p: 1.2,
                            '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                            '&:disabled': { bgcolor: 'action.disabledBackground' },
                            transition: 'all 0.2s',
                            ml: 1
                        }}
                        size="small"
                        onClick={handleSend}
                        disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                    >
                        {isUploading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                    </IconButton>
                </Paper>
            </Box>
        </Box>
    );
}
