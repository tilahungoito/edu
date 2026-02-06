import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

export const useRealTime = (event: string, callback: (data: any) => void) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            console.log('Connected to real-time server');
        });

        socketRef.current.on(event, (data) => {
            console.log(`Real-time update received for ${event}:`, data);
            callback(data);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from real-time server');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [event, callback]);

    const emit = (event: string, data: any) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    return { emit };
};
