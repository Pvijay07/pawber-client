import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initSocket = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !isMounted) return;

            // Disconnect existing socket if any
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            console.log('Connecting to socket at:', SOCKET_URL);
            
            // Initialize socket with authentication
            const newSocket = io(SOCKET_URL, {
                auth: {
                    token: session.access_token
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            newSocket.on('connect', () => {
                console.log('Socket.io connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket.io disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket.io connection error:', err.message);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        };

        // Initialize on mount
        initSocket();

        // Listen for auth changes to re-init socket
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                initSocket();
            } else if (event === 'SIGNED_OUT') {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                setSocket(null);
                setIsConnected(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
        };
    }, []);

    const emit = useCallback((event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn(`Cannot emit event ${event}: Socket not connected`);
        }
    }, [socket, isConnected]);

    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, callback);
            return () => {
                socket.off(event, callback);
            };
        }
        return () => {};
    }, [socket]);

    return { 
        socket, 
        isConnected, 
        emit, 
        on 
    };
};

