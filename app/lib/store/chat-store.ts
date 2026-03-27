import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender?: User;
    createdAt: string;
    type: string;
    attachmentUrl?: string;
    isRead: boolean;
    conversationId: string;
}

interface Conversation {
    id: string;
    name?: string;
    type: 'direct' | 'group';
    participants: { user: User; unreadCount: number }[];
    messages: Message[];
    updatedAt: string;
}

interface ChatState {
    socket: Socket | null;
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: Record<string, Message[]>; // conversationId -> messages
    isConnected: boolean;

    // Actions
    connect: () => void;
    disconnect: () => void;
    loadConversations: () => Promise<void>;
    selectConversation: (conversationId: string) => void;
    sendMessage: (content: string, type?: string, attachmentUrl?: string) => Promise<void>;
    uploadFile: (file: File) => Promise<{ url: string; filename: string; size: number; mimetype: string }>;
    createConversation: (participantIds: string[], type?: 'direct' | 'group', name?: string) => Promise<Conversation>;

    // Socket events
    handleNewMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    socket: null,
    conversations: [],
    activeConversationId: null,
    messages: {},
    isConnected: false,

    connect: () => {
        const { token, user } = useAuthStore.getState();
        if (!token || get().socket) return;

        const socket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:7000/api/v1'}/messaging`, {
            auth: {
                Authorization: `Bearer ${token}`,
            },
        });

        socket.on('connect', () => {
            set({ isConnected: true });
            console.log('Connected to chat server');
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
            console.log('Disconnected from chat server');
        });

        socket.on('newMessage', (message: Message) => {
            get().handleNewMessage(message);
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    loadConversations: async () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1'}/messaging/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            set({ conversations: Array.isArray(data) ? data : [] });
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    },

    selectConversation: async (conversationId: string) => {
        set({ activeConversationId: conversationId });
        const { token, socket } = useAuthStore.getState() as any; // simplified
        const authStore = useAuthStore.getState();

        // Join room if needed (handled by gateway usually but explicit join is good)
        if (get().socket) {
            get().socket?.emit('joinConversation', conversationId);
        }

        // Load messages
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1'}/messaging/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            const data = await response.json();

            // Reverse to show oldest first in UI if needed, or keep desc
            set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: Array.isArray(data) ? data.reverse() : []
                }
            }));
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    },

    sendMessage: async (content, type = 'text', attachmentUrl) => {
        const { activeConversationId, socket } = get();
        const { token } = useAuthStore.getState();

        if (!activeConversationId || !token) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1'}/messaging/conversations/${activeConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content, type, attachmentUrl })
            });

            if (!response.ok) throw new Error('Failed to send');

            // Optimistic update could happen here, but we wait for socket event for simplicity
        } catch (error) {
            console.error('Failed to send message', error);
        }
    },

    uploadFile: async (file) => {
        const { token } = useAuthStore.getState();
        if (!token) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1'}/files/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No response body');
                console.error('Upload failed with status:', response.status, errorText);
                let errorData = {};
                try { errorData = JSON.parse(errorText); } catch (e) { }
                throw new Error((errorData as any).message || 'Upload failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to upload file', error);
            throw error;
        }
    },

    createConversation: async (participantIds, type = 'direct', name) => {
        const { token } = useAuthStore.getState();
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1'}/messaging/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ participantIds, type, name })
            });
            const conversation = await response.json();

            set(state => ({
                conversations: [conversation, ...state.conversations],
                activeConversationId: conversation.id
            }));

            return conversation;
        } catch (error) {
            console.error('Failed to create conversation', error);
            throw error;
        }
    },

    handleNewMessage: (message) => {
        set((state) => {
            const conversationId = message.conversationId; // Assume message has this
            // Update messages list for this conversation
            const currentMessages = state.messages[conversationId] || [];

            // Update conversation list 'last message' or ordering
            const updatedConversations = state.conversations.map(c => {
                if (c.id === conversationId) {
                    return { ...c, updatedAt: new Date().toISOString(), messages: [message] };
                }
                return c;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            return {
                messages: {
                    ...state.messages,
                    [conversationId]: [...currentMessages, message]
                },
                conversations: updatedConversations
            };
        });
    }
}));
