import { useEffect, useState } from 'react';
import { type Sector } from './types';
import { supabase } from './config/supabaseConfig';
import { API_URL } from './config/apiConfig';

export function useRealTimeStatus() {
    const [sectors, setSectors] = useState<Sector[]>([]);

    useEffect(() => {
        // 1. Busca estado inicial via REST
        fetch(`${API_URL}/api/sectors`)
            .then((res) => res.json())
            .then((data) => setSectors(data))
            .catch((err) => console.error('Failed to load initial sectors:', err));

        // 2. Assina mudanças em tempo real via Supabase Realtime
        const channel = supabase
            .channel('sectors-realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Sector' },
                (payload) => {
                    console.log('[Realtime] UPDATE recebido:', payload);
                    const updatedSector = payload.new as Sector;
                    setSectors((prev) =>
                        prev.map((s) => (s.id === updatedSector.id ? updatedSector : s))
                    );
                }
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Status da assinatura:', status);
                if (err) console.error('[Realtime] Erro:', err);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateStatus = async (sectorId: string, status: Sector['status']) => {
        const token = localStorage.getItem('@RecepcaoSesa:token');
        try {
            await fetch(`${API_URL}/api/sectors/${sectorId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const updateQueue = async (sectorId: string, action: 'add' | 'remove') => {
        const token = localStorage.getItem('@RecepcaoSesa:token');
        try {
            await fetch(`${API_URL}/api/sectors/${sectorId}/queue`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
        } catch (err) {
            console.error('Failed to update queue:', err);
        }
    };

    return { sectors, updateStatus, updateQueue };
}
