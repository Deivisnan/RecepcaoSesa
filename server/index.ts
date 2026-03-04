import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/sectors', async (req, res) => {
    try {
        const sectors = await prisma.sector.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(sectors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sectors' });
    }
});

app.get('/api/sectors/:id', async (req, res) => {
    try {
        const sector = await prisma.sector.findUnique({
            where: { id: req.params.id },
        });
        if (!sector) {
            return res.status(404).json({ error: 'Sector not found' });
        }
        res.json(sector);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sector' });
    }
});

// Socket.io for Real-Time Status Updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // When a controller updates the status
    socket.on('update_status', async (data) => {
        try {
            const { sectorId, status } = data;

            const updatedSector = await prisma.sector.update({
                where: { id: sectorId },
                data: { status },
            });

            // Broadcast the change to ALL connected clients (especially the Reception Dashboard)
            io.emit('status_changed', updatedSector);

            console.log(`[Status Updated] ${updatedSector.name} -> ${updatedSector.status}`);
        } catch (error) {
            console.error('Error updating status:', error);
            socket.emit('error', { message: 'Failed to update status' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
