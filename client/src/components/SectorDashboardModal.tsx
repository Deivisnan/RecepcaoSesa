import React, { useState, useEffect } from 'react';
import { X, Search, BarChart3, Users, Calendar, Clock, Filter, Phone, Hash } from 'lucide-react';
import { API_URL } from '../config/apiConfig';
import { toast } from 'sonner';

interface SectorDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectorId: string;
    sectorName: string;
}

interface VisitData {
    id: string;
    code: string | null;
    timestamp: string;
    citizen: {
        cpf: string;
        name: string;
        phone: string | null;
    };
    user: {
        email: string;
    };
}

export const SectorDashboardModal: React.FC<SectorDashboardModalProps> = ({ isOpen, onClose, sectorId, sectorName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, cpf, name, phone
    const [visits, setVisits] = useState<VisitData[]>([]);
    const [loading, setLoading] = useState(false);

    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0
    });

    useEffect(() => {
        if (isOpen && sectorId) {
            fetchDashboardData();
        }
    }, [isOpen, sectorId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('@RecepcaoSesa:token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch today
            const resToday = await fetch(`${API_URL}/api/visits?sectorId=${sectorId}&ticketStatus=FINISHED&filterType=day&date=${new Date().toISOString()}`, { headers });
            const dataToday = await resToday.json();

            // Fetch week
            const resWeek = await fetch(`${API_URL}/api/visits?sectorId=${sectorId}&ticketStatus=FINISHED&filterType=week&date=${new Date().toISOString()}`, { headers });
            const dataWeek = await resWeek.json();

            // Fetch month
            const resMonth = await fetch(`${API_URL}/api/visits?sectorId=${sectorId}&ticketStatus=FINISHED&filterType=month&date=${new Date().toISOString()}`, { headers });
            const dataMonth = await resMonth.json();

            setStats({
                today: dataToday.length || 0,
                week: dataWeek.length || 0,
                month: dataMonth.length || 0
            });

            // Set all historical data (using month data as base history for the view, can be tweaked to fetch all if pagination is implemented)
            setVisits(dataMonth);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
            toast.error("Erro ao carregar dados do dashboard.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredVisits = visits.filter(visit => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        switch (filterType) {
            case 'cpf':
                return visit.citizen.cpf.includes(term.replace(/\D/g, ''));
            case 'name':
                return visit.citizen.name.toLowerCase().includes(term);
            case 'phone':
                return visit.citizen.phone && visit.citizen.phone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
            default: // all
                return (
                    visit.citizen.name.toLowerCase().includes(term) ||
                    visit.citizen.cpf.includes(term.replace(/\D/g, '')) ||
                    (visit.citizen.phone && visit.citizen.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')))
                );
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <header className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <BarChart3 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Análise de Dados</h2>
                            <p className="text-sm text-slate-400">Desempenho de atendimentos: {sectorName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Atendimentos Hoje</p>
                                <p className="text-3xl font-black text-white">{loading ? '...' : stats.today}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500/10 to-slate-800/50 border border-indigo-500/20 p-5 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Nesta Semana</p>
                                <p className="text-3xl font-black text-white">{loading ? '...' : stats.week}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-slate-800/50 border border-purple-500/20 p-5 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400">Neste Mês</p>
                                <p className="text-3xl font-black text-white">{loading ? '...' : stats.month}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar histórico..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">Todos os Campos</option>
                                <option value="name">Apenas Nome</option>
                                <option value="cpf">Apenas CPF</option>
                                <option value="phone">Apenas Telefone</option>
                            </select>
                        </div>
                    </div>

                    {/* Data List */}
                    <div className="flex-1 min-h-[300px] border border-slate-700/50 bg-slate-800/30 rounded-xl overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 gap-x-4 px-6 py-3 border-b border-slate-700/50 bg-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-2">Data/Hora</div>
                            <div className="col-span-4">Cidadão</div>
                            <div className="col-span-3">Cpf</div>
                            <div className="col-span-3">Contato</div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                </div>
                            ) : filteredVisits.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                                    <Search className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Nenhum registro encontrado.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {filteredVisits.map((visit) => (
                                        <div key={visit.id} className="grid grid-cols-12 gap-x-4 px-6 py-4 items-center hover:bg-slate-800/50 transition-colors">
                                            <div className="col-span-2 text-sm text-slate-300">
                                                <div className="font-medium">{new Date(visit.timestamp).toLocaleDateString('pt-BR')}</div>
                                                <div className="text-xs text-slate-500">{new Date(visit.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="col-span-4 text-sm font-medium text-white truncate pr-4">
                                                {visit.citizen.name}
                                            </div>
                                            <div className="col-span-3 flex items-center gap-2 text-sm text-slate-300 font-mono">
                                                <Hash className="w-3.5 h-3.5 text-slate-500" />
                                                {visit.citizen.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                                            </div>
                                            <div className="col-span-3 flex items-center gap-2 text-sm text-slate-300">
                                                {visit.citizen.phone ? (
                                                    <><Phone className="w-3.5 h-3.5 text-emerald-500" /><span>{visit.citizen.phone}</span></>
                                                ) : (
                                                    <span className="text-slate-600 italic">Não informado</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
