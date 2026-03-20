import React, { useState, useEffect } from 'react';
import { X, Users, Hash, Loader2, ClipboardList } from 'lucide-react';
import { API_URL } from '../config/apiConfig';

interface InServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectorId: string;
}

interface InServiceVisit {
    id: string;
    timestamp: string;
    citizen: {
        name: string;
        cpf: string;
    };
}

export const InServiceOrderModal: React.FC<InServiceOrderModalProps> = ({ 
    isOpen, 
    onClose, 
    sectorId 
}) => {
    const [loading, setLoading] = useState(false);
    const [visits, setVisits] = useState<InServiceVisit[]>([]);

    const fetchInService = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/sectors/${sectorId}/in-service`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVisits(data);
            }
        } catch (error) {
            console.error("Error fetching in-service list", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchInService();
        }
    }, [isOpen, sectorId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <header className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                            <ClipboardList className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Ordem de Atendimento</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cidadãos em Chamada/Local</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 min-h-[400px]">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-500">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">Carregando lista...</p>
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                            <Users className="w-16 h-16 mb-4 opacity-10" />
                            <p className="font-medium">Nenhum cidadão em atendimento no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    {visits.length} Cidadãos Presentes (Lote)
                                </span>
                            </div>
                            
                            {visits.map((visit, index) => (
                                <div
                                    key={visit.id}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 bg-slate-800/40 border-slate-700/50"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-xl font-black text-xl border border-emerald-500/20">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-white">
                                            {visit.citizen.name}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                                                <Hash className="w-3 h-3" /> {visit.citizen.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                Chegada: {new Date(visit.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-8 bg-slate-800/30 border-t border-slate-800">
                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                        Esta lista mostra a ordem correta de atendimento para os cidadãos que já foram chamados pelo painel principal.
                    </p>
                    <button 
                        onClick={onClose}
                        className="w-full mt-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700"
                    >
                        Fechar Visualização
                    </button>
                </footer>
            </div>
        </div>
    );
};
