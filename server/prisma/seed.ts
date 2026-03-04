import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sectors = [
    { name: 'Triagem' },
    { name: 'Vacinação' },
    { name: 'Consultório 1' },
    { name: 'Consultório 2' },
    { name: 'Farmácia' },
    { name: 'Odontologia' },
  ]

  console.log('Start seeding...')
  for (const sector of sectors) {
    const s = await prisma.sector.upsert({
      where: { name: sector.name },
      update: {},
      create: {
        name: sector.name,
      },
    })
    console.log(`Created sector with id: ${s.id}`)
  }
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
