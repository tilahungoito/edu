'use client';

import React, { useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import ConversationList from '@/app/components/chat/ConversationList';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { useChatStore } from '@/app/lib/store/chat-store';

export default function MessagesPage() {
    const { connect, disconnect } = useChatStore();

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: 'background.paper' }}>
            <Grid container sx={{ height: '100%' }}>
                <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ height: '100%', borderRight: '1px solid', borderColor: 'divider' }}>
                    <ConversationList />
                </Grid>
                <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ height: '100%', display: { xs: 'none', md: 'block' } }}>
                    <ChatWindow />
                </Grid>
            </Grid>
        </Box>
    );
}
