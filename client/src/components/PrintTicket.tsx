import React from 'react';

interface PrintTicketProps {
    printData: {
        cpf: string;
        name: string;
        sectorName: string;
        date: Date;
    } | null;
}

export const PrintTicket: React.FC<PrintTicketProps> = ({ printData }) => {
    if (!printData) return null;

    return (
        <div className="hidden print:block fixed inset-0 bg-white" style={{ fontFamily: 'sans-serif', color: 'black' }}>
            {/* The wrapper that defines the thermal printer width */}
            <div style={{ width: '300px', margin: '0 auto', padding: '15px', border: '1px dashed #999', textAlign: 'center', boxSizing: 'border-box' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                    Recepção SESA
                </h1>
                <div style={{ borderBottom: '1px solid black', marginBottom: '15px' }}></div>

                <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '3px' }}>CIDADÃO:</span>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', wordBreak: 'break-word', lineHeight: '1.2' }}>
                        {printData.name}
                    </p>
                </div>

                <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '3px' }}>CPF:</span>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>
                        {printData.cpf}
                    </p>
                </div>

                <div style={{ textAlign: 'left', marginTop: '15px', padding: '10px 0', borderTop: '1px dashed #ccc' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px' }}>SETOR DESTINO:</span>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', border: '2px solid black', padding: '8px', textAlign: 'center', backgroundColor: '#f9f9f9', pageBreakInside: 'avoid' }}>
                        {printData.sectorName}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid black', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', marginTop: '20px' }}>
                    <span>{printData.date.toLocaleDateString('pt-BR')}</span>
                    <span>{printData.date.toLocaleTimeString('pt-BR')}</span>
                </div>

                <div style={{ marginTop: '20px', fontSize: '10px', textTransform: 'uppercase', color: '#666', textAlign: 'center' }}>
                    Documento Impresso via Sistema
                </div>
            </div>
        </div>
    );
};

export default PrintTicket;
