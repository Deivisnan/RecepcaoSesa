export type SectorStatus = 'AVAILABLE' | 'BUSY' | 'AWAY';

export interface Sector {
    id: string;
    name: string;
    status: SectorStatus;
    queueCount: number;
    soundUrl?: string;
    updatedAt: string;
}

export interface Ticket {
    id: string;
    code: string;
    ticketStatus: 'WAITING' | 'IN_SERVICE' | 'FINISHED';
    citizenId: string;
    sectorId: string;
    timestamp: string;
    citizen: { cpf: string; name: string };
    sector: { id: string; name: string; soundUrl?: string };
}
