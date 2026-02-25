import prisma from '../src/utils/prisma';

async function main() {
  // Rename the default club to its real name
  const updated = await prisma.club.update({
    where: { id: 'default-club-id' },
    data: { name: 'Linas' }
  });
  console.log('Club renommé:', updated.name);

  // Show final state
  const clubs = await prisma.club.findMany({
    include: { _count: { select: { users: true, categories: true } } }
  });
  console.log('\n=== CLUBS FINAUX ===');
  clubs.forEach(c => console.log(`  [${c.id}] ${c.name} — users: ${c._count.users}, catégories: ${c._count.categories}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
