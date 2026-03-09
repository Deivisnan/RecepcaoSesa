import React, { useState } from 'react';
import { type Sector } from '../types';
import { Printer, UserPlus } from 'lucide-react';
import PrintTicket from './PrintTicket';
import { API_URL } from '../config/apiConfig';

interface AttendanceTabProps {
    sectors: Sector[];
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ sectors }) => {
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchingCpf, setSearchingCpf] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [printData, setPrintData] = useState<{ cpf: string, name: string, sectorName: string, date: Date } | null>(null);

    // Auto format CPF 000.000.000-00
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

        // Se tem 14 chars (formatado), busca.
        if (formatted.length === 14) {
            searchCitizen(formatted);
        } else {
            setName(''); // limpa se apagar
        }
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
            }
        } catch (error) {
            console.error('Error fetching citizen', error);
        } finally {
            setSearchingCpf(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cpf.length < 14 || !name || !selectedSector) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const res = await fetch(`${API_URL}/api/visits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cpf,
                    name,
                    sectorId: selectedSector
                })
            });

            if (res.ok) {
                const data = await res.json();

                // Tratar a impressão
                setPrintData({
                    cpf: data.citizen.cpf,
                    name: data.citizen.name,
                    sectorName: data.sector.name,
                    date: new Date(data.timestamp)
                });

                setSuccessMessage('Atendimento registrado com sucesso!');

                // Dispara impressão após renderizar o estado oculto
                setTimeout(() => {
                    window.print();
                    // Limpar form
                    setCpf('');
                    setName('');
                    setSelectedSector('');
                    setTimeout(() => setSuccessMessage(''), 3000);
                }, 500);
            } else {
                alert("Erro ao registrar atendimento");
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-indigo-400" />
                Novo Atendimento
            </h2>

            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg mb-6 flex items-center">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CPF */}
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">CPF do Cidadão</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cpf}
                                onChange={handleCpfChange}
                                placeholder="000.000.000-00"
                                maxLength={14}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                            {searchingCpf && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">
                                    Buscando...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NOME */}
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Nome Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome Completo do Cidadão"
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                        required
                    >
                        <option value="" disabled>Selecione um Setor...</option>
                        {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name} - ({s.status === 'AVAILABLE' ? 'Livre' : s.status === 'BUSY' ? 'Ocupado' : 'Ausente'})</option>
                        ))}
                    </select>
                </div>

                {/* SUBMIT */}
                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? 'Registrando...' : (
                            <>
                                Registrar e Imprimir Ticket
                                <Printer className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <PrintTicket printData={printData} />
        </div>
    );
};

export default AttendanceTab;
