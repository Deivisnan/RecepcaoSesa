export type SectorStatus = 'AVAILABLE' | 'BUSY' | 'AWAY';

export interface Sector {
    id: string;
    name: string;
    status: SectorStatus;
    updatedAt: string;
}
