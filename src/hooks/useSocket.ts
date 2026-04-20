import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const initSocket = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Initialize socket with authentication
            const socket = io(SOCKET_URL, {
                auth: {
                    token: session.access_token
                },
                transports: ['websocket']
            });

            socket.on('connect', () => {
                console.log('Socket.io connected');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('Socket.io disconnected');
                setIsConnected(false);
            });

            socket.on('connect_error', (err) => {
                console.error('Socket.io connection error:', err.message);
            });

            socketRef.current = socket;
        };

        if (!socketRef.current) {
            initSocket();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const emit = useCallback((event: string, data: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit(event, data);
        } else {
            console.warn(`Cannot emit event ${event}: Socket not connected`);
        }
    }, [isConnected]);

    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off(event, callback);
            }
        };
    }, []);

    return { 
        socket: socketRef.current, 
        isConnected, 
        emit, 
        on 
    };
};
