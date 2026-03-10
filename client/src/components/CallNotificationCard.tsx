import React, { useEffect, useState, useRef } from 'react';
import { type Ticket } from '../types';
import { supabase } from '../config/supabaseConfig';
import { Bell, X } from 'lucide-react';

/**
 * Painel de Notificação de Chamada — exibido na tela da Recepção.
 * Quando um setor chama o próximo (ticketStatus → IN_SERVICE),
 * este card aparece com: Nome, CPF e Código do Ticket.
 * Também toca o som específico do setor.
 */
const CallNotificationCard: React.FC = () => {
    const [notification, setNotification] = useState<Ticket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const channel = supabase
            .channel('visit-call-notifications')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Visit' },
                (payload) => {
                    const updated = payload.new as any;
                    if (updated.ticketStatus === 'IN_SERVICE') {
                        // Fetch full details (citizen name + sector sound)
                        const token = localStorage.getItem('@RecepcaoSesa:token');
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                        fetch(`${apiUrl}/api/citizens/${updated.citizenId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                            .then(r => r.json())
                            .then(citizen => {
                                setNotification({
                                    ...updated,
                                    citizen: { cpf: citizen.cpf, name: citizen.name },
                                    sector: { id: updated.sectorId, name: updated.sectorId, soundUrl: undefined }
                                });

                                // Toca som se o setor tiver soundUrl
                                if (updated.soundUrl) {
                                    if (audioRef.current) audioRef.current.pause();
                                    audioRef.current = new Audio(updated.soundUrl);
                                    audioRef.current.play().catch(() => { });
                                } else {
                                    // Tom padrão de notificação
                                    playDefaultChime();
                                }
                            })
                            .catch(() => { });
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const playDefaultChime = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const playTone = (freq: number, start: number, dur: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
                osc.start(start);
                osc.stop(start + dur);
            };
            playTone(880, ctx.currentTime, 0.4);
            playTone(660, ctx.currentTime + 0.3, 0.4);
            playTone(440, ctx.currentTime + 0.6, 0.6);
        } catch { }
    };

    if (!notification) return null;

    return (
        <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-2 border-indigo-500 rounded-2xl p-5 mb-6 relative shadow-lg shadow-indigo-500/20">
            <button
                onClick={() => setNotification(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Fechar notificação"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg animate-pulse">
                    <Bell className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider">Setor chamou o próximo</p>
                    <p className="text-white font-bold text-lg">{notification.sector?.name || 'Setor'}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-slate-400 text-xs">Código</p>
                    <p className="text-white font-black text-2xl tracking-widest font-mono">{notification.code}</p>
                </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-slate-400 text-xs mb-1">Cidadão</p>
                    <p className="text-white font-semibold">{notification.citizen?.name || '—'}</p>
                </div>
                <div>
                    <p className="text-slate-400 text-xs mb-1">CPF</p>
                    <p className="text-white font-mono">{notification.citizen?.cpf || '—'}</p>
                </div>
            </div>
        </div>
    );
};

export default CallNotificationCard;
