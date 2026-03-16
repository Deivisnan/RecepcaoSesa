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
interface NotificationItem extends Ticket {
    expiresAt: number;
}

const CallNotificationCard: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto-remove expired notifications every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            setNotifications(prev => prev.filter(n => n.expiresAt > now));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel('visit-call-notifications')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Visit' },
                async (payload) => {
                    const updated = payload.new as any;
                    if (updated.ticketStatus === 'IN_SERVICE') {
                        try {
                            const token = localStorage.getItem('@RecepcaoSesa:token');
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

                            const [citizenRes, sectorRes] = await Promise.all([
                                fetch(`${apiUrl}/api/citizens/${updated.citizenId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                                fetch(`${apiUrl}/api/sectors/${updated.sectorId}`, { headers: { 'Authorization': `Bearer ${token}` } })
                            ]);

                            const citizen = await citizenRes.json();
                            const sector = await sectorRes.json();

                            const newNotification: NotificationItem = {
                                ...updated,
                                citizen: { cpf: citizen.cpf, name: citizen.name },
                                sector: { id: sector.id, name: sector.name, soundUrl: sector.soundUrl },
                                expiresAt: Date.now() + 30000 // 30 seconds from now
                            };

                            setNotifications(prev => {
                                // Add new to the beginning, take max 3
                                const next = [newNotification, ...prev].slice(0, 3);
                                return next;
                            });

                            // Play sound
                            if (sector.soundUrl && !sector.soundUrl.includes('notification.mp3')) {
                                if (audioRef.current) audioRef.current.pause();
                                audioRef.current = new Audio(sector.soundUrl);
                                audioRef.current.play().catch(() => {});
                            } else {
                                playDefaultChime();
                            }
                        } catch (error) {
                            console.error('Error fetching call details:', error);
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const audioCtxRef = useRef<AudioContext | null>(null);

    const playDefaultChime = () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContext) return;
                audioCtxRef.current = new AudioContext();
            }
            
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            
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

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] w-full max-w-md space-y-4 pointer-events-none">
            {notifications.map((notification) => (
                <div 
                    key={notification.id}
                    className="pointer-events-auto animate-in fade-in slide-in-from-right-8 duration-500 bg-slate-900/95 backdrop-blur-md border-2 border-indigo-500 rounded-2xl p-4 relative shadow-2xl shadow-indigo-500/20 overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" />

                    <button
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-lg border border-white/10 z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 p-3 bg-indigo-600 rounded-xl shadow-lg relative">
                            <Bell className="w-6 h-6 text-white animate-bounce" />
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Chamada</span>
                                <h3 className="text-white font-black text-lg tracking-tight uppercase truncate">
                                    Setor {notification.sector?.name || 'Setor'}
                                </h3>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-slate-500 text-[10px] font-bold uppercase shrink-0">Cidadão:</span>
                                    <span className="text-slate-100 font-bold text-base truncate">{notification.citizen?.name || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    <span className="font-bold flex items-center gap-1">
                                        TICKET <span className="text-indigo-400 text-sm font-black">{notification.code}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Expiration Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-slide-out-left origin-left w-full" style={{ animationDuration: '30s', animationTimingFunction: 'linear' }} />
                </div>
            ))}
        </div>
    );
};

export default CallNotificationCard;
