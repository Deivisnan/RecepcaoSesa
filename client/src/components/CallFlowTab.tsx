import React, { useEffect, useState } from 'react';
import { Clock, User, ArrowRight, CheckCircle2, History } from 'lucide-react';
import { API_URL } from '../config/apiConfig';
import { toast } from 'sonner';

interface CallRecord {
    id: string;
    code: string | null;
    timestamp: string;
    ticketStatus: string | null;
    citizen: { name: string };
    sector: { name: string };
}

const CallFlowTab: React.FC = () => {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTodayCalls = async () => {
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`${API_URL}/api/visits?date=${today}&filterType=day`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data: CallRecord[] = await res.json();
                // Filter only those who were at least called (IN_SERVICE or FINISHED)
                // and have a valid code (to exclude old broken records if any)
                const filtered = data
                    .filter(v => (v.ticketStatus === 'IN_SERVICE' || v.ticketStatus === 'FINISHED') && v.code)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setCalls(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch today calls', error);
            toast.error('Erro ao carregar fluxo de hoje');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayCalls();
        const interval = setInterval(fetchTodayCalls, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading && calls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p>Carregando fluxo de chamados...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <History className="text-indigo-400 w-6 h-6" />
                        Fluxo de Chamados (Hoje)
                    </h2>
                    <p className="text-slate-400 text-sm">Registro em tempo real das chamadas realizadas pelos setores.</p>
                </div>
                <button
                    onClick={fetchTodayCalls}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                    title="Atualizar"
                >
                    <Clock className="w-5 h-5" />
                </button>
            </div>

            {calls.length === 0 ? (
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-2xl py-12 flex flex-col items-center text-slate-500">
                    <Clock className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-lg">Nenhum chamado realizado até o momento hoje.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {calls.map((call) => (
                        <div
                            key={call.id}
                            className={`group bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between transition-all hover:bg-slate-800 ${call.ticketStatus === 'IN_SERVICE' ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-emerald-500 opacity-80'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg ${call.ticketStatus === 'IN_SERVICE' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold text-lg">{call.code}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                        <span className="text-indigo-300 font-semibold">{call.sector.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{call.citizen.name}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="font-mono">
                                            {new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${call.ticketStatus === 'IN_SERVICE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {call.ticketStatus === 'IN_SERVICE' ? (
                                        <>
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                            Chamado agora
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Finalizado
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CallFlowTab;
