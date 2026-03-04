import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealTimeStatus } from '../useRealTimeStatus';

const Controller: React.FC = () => {
    const { sectorId } = useParams<{ sectorId: string }>();
    const { sectors, updateStatus } = useRealTimeStatus();

    const sector = sectors.find(s => s.id === sectorId);

    if (!sector) {
        return <div className="loading-text">Buscando setor ou Setor Inexistente...</div>;
    }

    return (
        <div className="controller-layout">
            <header className="controller-header">
                <h1>{sector.name}</h1>
                <p>Controle de Status da Sala</p>
            </header>

            <main className="controller-actions">
                <button
                    className={`action-btn btn-available ${sector.status === 'AVAILABLE' ? 'active' : ''}`}
                    onClick={() => updateStatus(sector.id, 'AVAILABLE')}
                >
                    LIVRE (Finalizar)
                </button>

                <button
                    className={`action-btn btn-busy ${sector.status === 'BUSY' ? 'active' : ''}`}
                    onClick={() => updateStatus(sector.id, 'BUSY')}
                >
                    OCUPADO (Iniciar)
                </button>

                <button
                    className={`action-btn btn-away ${sector.status === 'AWAY' ? 'active' : ''}`}
                    onClick={() => updateStatus(sector.id, 'AWAY')}
                >
                    AUSENTE (Pausa)
                </button>
            </main>
        </div>
    );
};

export default Controller;
