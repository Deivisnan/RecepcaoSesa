import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Printer } from 'lucide-react';

interface Visit {
    id: string;
    citizen: {
        cpf: string;
        name: string;
    };
    sector: {
        name: string;
    };
    timestamp: string;
    user?: {
        email: string;
    };
}

export const HistoryTab: React.FC = () => {
    const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const url = `http://localhost:3001/api/visits?date=${selectedDate}&filterType=${filterType}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setVisits(data);
            }
        } catch (error) {
            console.error('Failed to fetch visits', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, selectedDate]);

    const handleReprint = (visit: Visit) => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 10px; display: flex; justify-content: center; background: white; color: black; }
                    .ticket { width: 300px; padding: 15px; border: 1px dashed #999; text-align: center; }
                    h1 { font-size: 20px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; }
                    .divider { border-bottom: 1px solid black; margin-bottom: 15px; }
                    .info-group { text-align: left; margin-bottom: 12px; }
                    .label { font-size: 11px; font-weight: bold; color: #555; display: block; margin-bottom: 3px; }
                    .value { font-size: 15px; font-weight: 600; word-break: break-word; line-height: 1.2; margin: 0; }
                    .sector-box { font-size: 18px; font-weight: bold; text-transform: uppercase; border: 2px solid black; padding: 8px; text-align: center; margin-top: 5px; background: #f9f9f9;}
                    .footer { border-top: 1px solid black; padding-top: 10px; font-size: 12px; display: flex; justify-content: space-between; font-family: monospace; margin-top: 20px;}
                    .note { font-size: 10px; color: #666; margin-top: 20px; text-transform: uppercase; }
                    @media print {
                        @page { margin: 0; }
                        body { margin: 0; padding: 0; }
                        .ticket { border: none; }
                    }
                </style>
            </head>
            <body>
               <div class="ticket">
                   <h1>RECEPÇÃO SESA</h1>
                   <div class="divider"></div>
                   
                   <div class="info-group">
                       <span class="label">CIDADÃO:</span>
                       <p class="value">${visit.citizen.name}</p>
                   </div>
                   
                   <div class="info-group">
                       <span class="label">CPF:</span>
                       <p class="value">${visit.citizen.cpf}</p>
                   </div>
                   
                   <div class="info-group" style="padding-top: 5px;">
                       <span class="label">SETOR DESTINO:</span>
                       <div class="sector-box">${visit.sector.name}</div>
                   </div>

                   <div class="footer">
                       <span>${new Date(visit.timestamp).toLocaleDateString('pt-BR')}</span>
                       <span>${new Date(visit.timestamp).toLocaleTimeString('pt-BR')}</span>
                   </div>
                   
                   <div class="note">* REIMPRESSÃO COPIA</div>
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

    // Calculate metrics
    const metrics = useMemo(() => {
        if (!visits.length) return { total: 0, highPeak: null, lowPeak: null };

        // Group by day for peaks (if week or month)
        // Group by hour for peaks (if day)
        const groups: Record<string, number> = {};

        visits.forEach(v => {
            const date = new Date(v.timestamp);
            let key = '';

            if (filterType === 'day') {
                key = `${date.getHours()}:00 - ${date.getHours() + 1}:00`;
            } else {
                key = date.toLocaleDateString('pt-BR');
            }

            groups[key] = (groups[key] || 0) + 1;
        });

        let max = -1;
        let min = Infinity;
        let highPeakStr = '-';
        let lowPeakStr = '-';

        Object.entries(groups).forEach(([key, count]) => {
            if (count > max) { max = count; highPeakStr = key; }
            if (count < min) { min = count; lowPeakStr = key; }
        });

        // If only one group exists, min/max logic might overlap
        if (Object.keys(groups).length === 1) {
            lowPeakStr = highPeakStr;
        }

        return {
            total: visits.length,
            highPeak: { label: highPeakStr, count: max },
            lowPeak: { label: lowPeakStr, count: min === Infinity ? 0 : min }
        };
    }, [visits, filterType]);

    return (
        <div className="space-y-6">
            {/* Filters Area */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                        <button
                            onClick={() => setFilterType('day')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'day' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setFilterType('week')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setFilterType('month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Mês
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="text-slate-400 w-5 h-5" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Dashboard Cards Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="w-24 h-24 text-blue-500" />
                    </div>
                    <p className="text-slate-400 font-medium mb-1">Total Atendimentos</p>
                    <h3 className="text-4xl font-bold text-white mb-2">{metrics.total}</h3>
                    <p className="text-sm text-slate-500">No período selecionado</p>
                </div>

                <div className="bg-slate-800 border border-emerald-900/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 font-medium">Pico de Fluxo (Alto)</p>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{metrics.highPeak?.label || '-'}</h3>
                    <p className="text-sm text-emerald-400">{metrics.highPeak?.count || 0} pessoas</p>
                </div>

                <div className="bg-slate-800 border border-rose-900/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 font-medium">Pico de Fluxo (Baixo)</p>
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{metrics.lowPeak?.label || '-'}</h3>
                    <p className="text-sm text-rose-400">{metrics.lowPeak?.count || 0} pessoas</p>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Registros de Visitas</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium tracking-wider">Data / Hora</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Cidadão</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Setor Destino</th>
                                <th className="px-6 py-4 font-medium tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Carregando dados...</td>
                                </tr>
                            ) : visits.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum registro encontrado para este período.</td>
                                </tr>
                            ) : (
                                visits.map(visit => (
                                    <tr key={visit.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{new Date(visit.timestamp).toLocaleDateString('pt-BR')}</div>
                                            <div className="text-slate-400 text-xs">{new Date(visit.timestamp).toLocaleTimeString('pt-BR')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{visit.citizen.name}</div>
                                            <div className="text-slate-400 text-xs">{visit.citizen.cpf}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-indigo-400 border border-indigo-500/20">
                                                {visit.sector.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleReprint(visit)}
                                                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-700 p-2 rounded-lg transition-colors border border-slate-700 inline-flex items-center gap-2"
                                                title="Reimprimir Ticket"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span className="hidden sm:inline">Reimprimir</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryTab;
