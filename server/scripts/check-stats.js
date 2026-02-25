const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const [sportifs, coaches, trainings, categories, users] = await Promise.all([
    p.sportif.count(),
    p.coach.count(),
    p.training.count(),
    p.category.count(),
    p.user.count(),
  ]);

  const nextTrainings = await p.training.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    include: { category: true },
  });

  const attendanceTotal = await p.attendance.count();
  const attendancePresent = await p.attendance.count({ where: { present: true } });

  console.log('=== CHIFFRES EN BASE ===');
  console.log('Sportifs    :', sportifs);
  console.log('Coachs      :', coaches);
  console.log('Entraînements:', trainings);
  console.log('Catégories  :', categories);
  console.log('Utilisateurs:', users);
  console.log('Présences   :', attendancePresent, '/', attendanceTotal);
  console.log('Prochains événements:', nextTrainings.length);
  nextTrainings.forEach(t => {
    console.log(` - [${t.category?.name}] ${t.type} le ${new Date(t.date).toLocaleDateString('fr-FR')} à ${new Date(t.date).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}`);
  });

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
