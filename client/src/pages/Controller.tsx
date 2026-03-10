import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeStatus } from '../useRealTimeStatus';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, CheckCircle2, AlertTriangle, ShieldAlert, Users, PhoneCall, Hash, CheckCheck } from 'lucide-react';
import { API_URL } from '../config/apiConfig';
import { toast } from 'sonner';

const Controller: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { sectors, updateStatus } = useRealTimeStatus();

    // Checkout state
    const [checkoutCode, setCheckoutCode] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [callingNext, setCallingNext] = useState(false);

    const sector = useMemo(() => {
        if (!user?.sectorName) return undefined;
        return sectors.find(s => s.name.toLowerCase() === user.sectorName?.toLowerCase());
    }, [sectors, user]);

    const prevQueueRef = useRef(sector?.queueCount || 0);

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const playTone = (freq: number, startTime: number, duration: number) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, startTime);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            playTone(659.25, audioCtx.currentTime, 0.4);
            playTone(523.25, audioCtx.currentTime + 0.25, 0.6);
        } catch { }
    };

    useEffect(() => {
        if (sector && sector.queueCount > prevQueueRef.current) {
            playNotificationSound();
        }
        if (sector) prevQueueRef.current = sector.queueCount;
    }, [sector?.queueCount]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCallNext = async () => {
        if (!sector) return;
        setCallingNext(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/sectors/${sector.id}/call-next`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Chamando: ${data.code} — ${data.citizen?.name || ''}`);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Nenhum cidadão na fila');
            }
        } catch {
            toast.error('Erro de conexão');
        } finally {
            setCallingNext(false);
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutCode.trim()) { toast.error('Digite o código'); return; }
        setCheckoutLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/visits/${checkoutCode.toUpperCase()}/checkout`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`Ticket ${checkoutCode.toUpperCase()} finalizado!`);
                setCheckoutCode('');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Código não encontrado');
            }
        } catch {
            toast.error('Erro de conexão');
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (!user?.sectorName) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <p className="text-white">Usuário do setor não identificado.</p>
            </div>
        );
    }

    if (sectors.length > 0 && !sector) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Setor não encontrado</h2>
                <p className="text-slate-400 mb-6">O setor "{user.sectorName}" não consta na base de dados.</p>
                <button onClick={handleLogout} className="px-6 py-2 bg-slate-800 text-white rounded-lg">Sair</button>
            </div>
        );
    }

    if (!sector) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 max-w-lg mx-auto w-full">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo Prefeitura" className="h-10 object-contain" />
                    <div>
                        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Painel de Controle</p>
                        <h1 className="text-3xl font-bold text-white mt-1">{sector.name}</h1>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300" title="Sair">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center max-w-lg mx-auto w-full gap-4">
                {/* Queue count */}
                <div className="w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 font-medium mb-1">Pessoas na fila de espera</p>
                        <p className="text-sm text-slate-500">Atualizado em tempo real</p>
                    </div>
                    <div className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-4 rounded-xl flex items-center gap-3">
                        <Users className="w-8 h-8 opacity-80" />
                        <span className="text-4xl font-black">{sector.queueCount || 0}</span>
                    </div>
                </div>

                {/* Chamar Próximo */}
                <button
                    onClick={handleCallNext}
                    disabled={callingNext || sector.queueCount === 0}
                    className="w-full flex items-center justify-center gap-3 p-5 bg-indigo-600/20 hover:bg-indigo-600/40 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-indigo-500 rounded-2xl text-indigo-300 font-bold text-xl transition-all"
                >
                    <PhoneCall className="w-8 h-8" />
                    {callingNext ? 'Chamando...' : 'Chamar Próximo'}
                </button>

                {/* Status buttons */}
                <button
                    className={`w-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${sector.status === 'AVAILABLE' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80 scale-95 opacity-70 hover:opacity-100'}`}
                    onClick={() => updateStatus(sector.id, 'AVAILABLE')}
                >
                    <CheckCircle2 className={`w-10 h-10 mb-2 ${sector.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className={`text-xl font-bold tracking-widest ${sector.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-slate-300'}`}>LIVRE</span>
                </button>

                <button
                    className={`w-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${sector.status === 'BUSY' ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80 scale-95 opacity-70 hover:opacity-100'}`}
                    onClick={() => updateStatus(sector.id, 'BUSY')}
                >
                    <ShieldAlert className={`w-10 h-10 mb-2 ${sector.status === 'BUSY' ? 'text-rose-500' : 'text-slate-400'}`} />
                    <span className={`text-xl font-bold tracking-widest ${sector.status === 'BUSY' ? 'text-rose-400' : 'text-slate-300'}`}>OCUPADO</span>
                </button>

                <button
                    className={`w-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${sector.status === 'AWAY' ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80 scale-95 opacity-70 hover:opacity-100'}`}
                    onClick={() => updateStatus(sector.id, 'AWAY')}
                >
                    <AlertTriangle className={`w-10 h-10 mb-2 ${sector.status === 'AWAY' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className={`text-xl font-bold tracking-widest ${sector.status === 'AWAY' ? 'text-amber-400' : 'text-slate-300'}`}>AUSENTE</span>
                </button>

                {/* Dar Baixa */}
                <div className="w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 mt-2">
                    <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
                        <CheckCheck className="w-5 h-5 text-emerald-400" />
                        Dar Baixa no Atendimento
                    </h3>
                    <form onSubmit={handleCheckout} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={checkoutCode}
                                onChange={(e) => setCheckoutCode(e.target.value.toUpperCase())}
                                placeholder="Ex: A-045"
                                maxLength={6}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-mono tracking-widest uppercase"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={checkoutLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition-all"
                        >
                            {checkoutLoading ? '...' : 'Finalizar'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Controller;
