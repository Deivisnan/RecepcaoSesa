import React, { useState } from 'react';
import { type Sector } from '../types';
import { Printer, UserPlus, AlertTriangle, CheckCircle, Hash } from 'lucide-react';
import { API_URL } from '../config/apiConfig';
import { toast } from 'sonner';

interface AttendanceTabProps {
    sectors: Sector[];
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ sectors }) => {
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchingCpf, setSearchingCpf] = useState(false);
    const [lastTicket, setLastTicket] = useState<{ code: string; sectorName: string; date: Date } | null>(null);

    // Checkout state
    const [checkoutCode, setCheckoutCode] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const formatCpf = (val: string) => {
        return val.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCpf(e.target.value);
        setCpf(formatted);
        if (formatted.length === 14) searchCitizen(formatted);
        else setName('');
    };

    const searchCitizen = async (searchCpf: string) => {
        setSearchingCpf(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/citizens/${searchCpf}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setName(data.name);
                toast.success(`Cidadão encontrado: ${data.name}`);
            }
        } catch (error) {
            console.error('Error fetching citizen', error);
        } finally {
            setSearchingCpf(false);
        }
    };

    const selectedSectorObj = sectors.find(s => s.id === selectedSector);
    const isAwayBlocked = selectedSectorObj?.status === 'AWAY';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cpf.length < 14 || !name || !selectedSector) {
            toast.error('Preencha todos os campos corretamente.');
            return;
        }
        if (isAwayBlocked) {
            toast.error('Setor ausente. Não é possível adicionar à fila.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/visits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ cpf, name, sectorId: selectedSector })
            });

            if (res.ok) {
                const data = await res.json();
                const ticketInfo = {
                    code: data.code,
                    sectorName: data.sector.name,
                    date: new Date(data.timestamp)
                };
                setLastTicket(ticketInfo);
                toast.success(`Ticket ${data.code} gerado com sucesso!`);

                // Print
                setTimeout(() => {
                    window.print();
                    setCpf('');
                    setName('');
                    setSelectedSector('');
                }, 300);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Erro ao registrar atendimento');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutCode.trim()) {
            toast.error('Digite o código do ticket.');
            return;
        }
        setCheckoutLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/visits/${checkoutCode.toUpperCase()}/checkout`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`Ticket ${checkoutCode.toUpperCase()} finalizado com sucesso!`);
                setCheckoutCode('');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Erro ao dar baixa');
            }
        } catch {
            toast.error('Erro de conexão');
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* REGISTRO */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <UserPlus className="text-indigo-400" />
                    Novo Atendimento
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">CPF do Cidadão</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    required
                                />
                                {searchingCpf && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">Buscando...</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome Completo do Cidadão"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* SETOR */}
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Setor de Destino</label>
                        <select
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            required
                        >
                            <option value="" disabled>Selecione um Setor...</option>
                            {sectors.map(s => (
                                <option key={s.id} value={s.id} disabled={s.status === 'AWAY'}>
                                    {s.name} — {s.status === 'AVAILABLE' ? '✅ Livre' : s.status === 'BUSY' ? '🔴 Ocupado' : '⚠️ Ausente (bloqueado)'}
                                </option>
                            ))}
                        </select>

                        {isAwayBlocked && (
                            <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-4 py-3 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span><strong>Setor Ausente.</strong> Não é possível adicionar cidadãos à fila deste setor no momento.</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || isAwayBlocked}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            {loading ? 'Registrando...' : (<><Printer className="w-5 h-5" />Registrar e Imprimir Ticket</>)}
                        </button>
                    </div>
                </form>
            </div>

            {/* DAR BAIXA (pelo setor — mas recepção também pode ver o campo como informação) */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" />
                    Dar Baixa no Ticket
                </h2>
                <form onSubmit={handleCheckout} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={checkoutCode}
                            onChange={(e) => setCheckoutCode(e.target.value.toUpperCase())}
                            placeholder="Ex: A-045"
                            maxLength={6}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono tracking-widest uppercase"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={checkoutLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all"
                    >
                        {checkoutLoading ? 'Aguarde...' : 'Finalizar'}
                    </button>
                </form>
            </div>

            {/* PRINT AREA — oculta na tela, visível apenas na impressão */}
            {lastTicket && (
                <div className="hidden print:block print:fixed print:inset-0 print:flex print:items-center print:justify-center">
                    <div style={{ fontFamily: 'monospace', border: '2px solid #000', padding: '24px', width: '280px', textAlign: 'center' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '180px', margin: '0 auto 12px' }} />
                        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>SECRETARIA MUNICIPAL DE SAÚDE</h2>
                        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '12px 0', margin: '12px 0' }}>
                            <p style={{ fontSize: '13px', marginBottom: '4px' }}>Setor: <strong>{lastTicket.sectorName}</strong></p>
                            <p style={{ fontSize: '40px', fontWeight: 'bold', letterSpacing: '4px', margin: '8px 0' }}>{lastTicket.code}</p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#555' }}>
                            {lastTicket.date.toLocaleDateString('pt-BR')} às {lastTicket.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style={{ fontSize: '11px', marginTop: '12px', color: '#777' }}>Aguarde ser chamado.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTab;
