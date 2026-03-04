import React from 'react';
import { useRealTimeStatus } from '../useRealTimeStatus';
import { Sector } from '../types';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';

const StatusIcon = ({ status }: { status: Sector['status'] }) => {
    switch (status) {
        case 'AVAILABLE':
            return <CheckCircle2 size={48} className="icon available-icon" />;
        case 'BUSY':
            return <Activity size={48} className="icon busy-icon" />;
        case 'AWAY':
            return <Clock size={48} className="icon away-icon" />;
        default:
            return null;
    }
};

const statusText = {
    AVAILABLE: 'LIVRE',
    BUSY: 'OCUPADO',
    AWAY: 'AUSENTE',
};

const Dashboard: React.FC = () => {
    const { sectors } = useRealTimeStatus();

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <h1>Painel de Sinalização</h1>
                <p>Acompanhe a disponibilidade das salas em tempo real</p>
            </header>

            <main className="sectors-grid">
                {sectors.length === 0 && <p className="loading-text">Carregando setores...</p>}
                {sectors.map((sector) => (
                    <div key={sector.id} className={`status-card card-${sector.status.toLowerCase()}`}>
                        <div className="card-header">
                            <h2>{sector.name}</h2>
                        </div>
                        <div className="card-body">
                            <StatusIcon status={sector.status} />
                            <span className="status-label">{statusText[sector.status]}</span>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default Dashboard;
