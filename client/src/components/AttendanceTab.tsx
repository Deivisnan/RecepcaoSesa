import React, { useState } from 'react';
import { type Sector } from '../types';
import { Printer, UserPlus, AlertTriangle } from 'lucide-react';
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

    const printTicket = (data: { code: string, sectorName: string, citizenName: string, date: Date }) => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; display: flex; justify-content: center; background: white; color: black; }
                    .ticket { width: 280px; padding: 20px; border: 2px solid #000; text-align: center; }
                    img { width: 150px; margin-bottom: 10px; }
                    h1 { font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .code { font-size: 40px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
                    .info { font-size: 13px; margin: 5px 0; }
                    .citizen { font-size: 14px; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
                    .footer { font-size: 11px; margin-top: 15px; color: #555; }
                    @media print {
                        @page { margin: 0; }
                        body { margin: 0; padding: 0; }
                        .ticket { border: none; }
                    }
                </style>
            </head>
            <body>
               <div class="ticket">
                   <img src="/logo.png" alt="Logo">
                   <h1>SECRETARIA MUNICIPAL DE SAÚDE</h1>
                   <p style="font-size: 10px; margin: 0;">PREFEITURA DE LAURO DE FREITAS</p>
                   
                   <div class="divider"></div>
                   
                   <div class="info">Setor: <strong>${data.sectorName}</strong></div>
                   <div class="citizen">${data.citizenName}</div>
                   <div class="code">${data.code}</div>
                   
                   <div class="divider"></div>

                   <div class="footer">
                       <div>Data: ${data.date.toLocaleDateString('pt-BR')}</div>
                       <div>Hora: ${data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                       <div style="margin-top: 10px; font-style: italic;">Aguarde ser chamado.</div>
                   </div>
               </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
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

                // Print using unified style
                printTicket({
                    code: data.code,
                    sectorName: data.sector.name,
                    citizenName: data.citizen.name,
                    date: new Date(data.timestamp)
                });

                toast.success(`Ticket ${data.code} gerado com sucesso!`);

                setCpf('');
                setName('');
                setSelectedSector('');
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
        </div>
    );
};

export default AttendanceTab;
