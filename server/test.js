const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const visit = await prisma.visit.findUnique({
        where: { code: 'GAB-016' },
        include: { sector: true }
    });
    console.log(visit);
}

check().catch(console.error).finally(() => prisma.$disconnect());
