"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Remove existing sectors before seeding to avoid duplicates
    await prisma.sector.deleteMany({});
    const sectors = [
        { name: 'Contabilidade' },
        { name: 'Adm e financeiro' },
        { name: 'Coordenação financeira' },
        { name: 'Compras' },
        { name: 'Contratos' },
        { name: 'Gabinete' },
        { name: 'Protocolo' },
        { name: 'Vigilância sanitária' },
        { name: 'Especializada' },
        { name: 'VIEP' },
        { name: 'Vigilância trabalhador' },
        { name: 'Atenção Básica' },
        { name: 'RH' },
        { name: 'Ouvidoria' },
        { name: 'Manutenção' },
        { name: 'DFI' },
        { name: 'Saúde ocupacional' },
        { name: 'Transporte e segurança' }
    ];
    console.log('Start seeding...');
    for (const sector of sectors) {
        const s = await prisma.sector.upsert({
            where: { name: sector.name },
            update: {},
            create: {
                name: sector.name,
            },
        });
        console.log(`Created sector with id: ${s.id}`);
    }
    // Create Default Admin User
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const adminEmail = 'ti@admin.com';
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { password: adminPassword, role: 'ADMIN' },
        create: {
            email: adminEmail,
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log(`Created Admin user: ${adminUser.email} (password: admin123)`);
    console.log('Seeding finished.');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
