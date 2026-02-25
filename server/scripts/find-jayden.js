const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const sportifs = await p.sportif.findMany({
    where: { firstName: { contains: 'Jayden' } },
    include: { category: true, user: { select: { email: true } } }
  });
  console.log('Résultats:', JSON.stringify(sportifs, null, 2));
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
