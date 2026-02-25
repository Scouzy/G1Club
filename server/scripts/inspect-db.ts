import prisma from '../src/utils/prisma';

async function main() {
  const clubs = await prisma.club.findMany({
    include: { _count: { select: { users: true, categories: true } } }
  });
  console.log('\n=== CLUBS ===');
  clubs.forEach(c => console.log(`  [${c.id}] ${c.name} — users: ${c._count.users}, categories: ${c._count.categories}`));

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, clubId: true } });
  console.log('\n=== USERS ===');
  users.forEach(u => console.log(`  [${u.role}] ${u.name} (${u.email}) → clubId: ${u.clubId}`));

  const cats = await prisma.category.findMany({ select: { id: true, name: true, clubId: true } });
  console.log('\n=== CATEGORIES ===');
  cats.forEach(c => console.log(`  ${c.name} → clubId: ${c.clubId}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
