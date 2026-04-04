import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

// Singleton socket so all hooks share one connection
let sharedSocket: Socket | null = null;
let connectionCount = 0;

function getSocket(): Socket {
    if (!sharedSocket || !sharedSocket.connected) {
        sharedSocket = io(SOCKET_URL, { reconnection: true, reconnectionDelay: 1000 });
        sharedSocket.on('connect', () => console.log('[RealTime] Connected:', sharedSocket?.id));
        sharedSocket.on('disconnect', () => console.log('[RealTime] Disconnected'));
    }
    return sharedSocket;
}

export const useRealTime = (event: string, callback: (data: any) => void) => {
    // Use a ref so we always call the latest callback without re-subscribing
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const socket = getSocket();
        connectionCount++;

        const handler = (data: any) => {
            console.log(`[RealTime] Event "${event}" received`, data);
            callbackRef.current(data);
        };

        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
            connectionCount--;
            // Disconnect only when no more listeners
            if (connectionCount === 0 && sharedSocket) {
                sharedSocket.disconnect();
                sharedSocket = null;
            }
        };
    }, [event]); // Only depends on event name, NOT the callback

    const emit = useCallback((emitEvent: string, data: any) => {
        getSocket().emit(emitEvent, data);
    }, []);

    return { emit };
};
