import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for subscribing to Supabase realtime table changes.
 */
export function useSupabaseRealtime(table: string, callback: (payload: any) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const channel = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
                callbackRef.current(payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table]);
}

/**
 * Hook for real-time GPS tracking (for live tracking screen).
 */
export function useGPSTracking(bookingId: string) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const fetchInitial = async () => {
            const { data } = await supabase
                .from('locations')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setPosition({ lat: data.x, lng: data.y });
        };

        fetchInitial();

        const channel = supabase
            .channel(`gps:${bookingId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'locations',
                filter: `booking_id=eq.${bookingId}`,
            }, (payload) => {
                setPosition({ lat: payload.new.x, lng: payload.new.y });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId]);

    return position;
}

/**
 * Generic async data fetching hook.
 */
export function useAsync<T>(
    asyncFn: () => Promise<T>,
    deps: any[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await asyncFn();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        execute();
    }, [execute]);

    return { data, loading, error, refetch: execute };
}
