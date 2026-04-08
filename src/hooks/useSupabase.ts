import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseRealtime(table: string, callback: (payload: any) => void) {
    useEffect(() => {
        const channel = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, callback]);
}

export function useGPSPointer(bookingId: string) {
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        // Initial fetch
        const fetchInitial = async () => {
            const { data } = await supabase
                .from('locations')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setPosition({ x: data.x, y: data.y });
        };

        fetchInitial();

        // Subscribe to updates
        const channel = supabase
            .channel(`gps:${bookingId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'locations',
                filter: `booking_id=eq.${bookingId}`
            }, (payload: { new: { x: number; y: number } }) => {
                setPosition({ x: payload.new.x, y: payload.new.y });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId]);

    return position;
}
