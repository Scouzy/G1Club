const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  // Find the club
  const clubs = await p.club.findMany({ select: { id: true, name: true } });
  console.log('Clubs:', JSON.stringify(clubs, null, 2));

  const club = clubs.find(c => c.name && c.name.toLowerCase().includes('linas')) || clubs[0];
  if (!club) { console.log('Aucun club trouvé'); return; }
  console.log('Club sélectionné:', club.name, club.id);

  const email = 'coach.linas@sportemergence.fr';
  const password = 'coach123';

  const existing = await p.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Compte déjà existant:', email);
    await p.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await p.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Coach Linas',
      role: 'COACH',
      clubId: club.id,
      emailVerified: true,
    }
  });

  const coach = await p.coach.create({
    data: {
      userId: user.id,
      qualifications: 'Diplôme Fédéral Entraîneur',
      experience: 'Entraîneur club Linas',
    },
    include: { user: { select: { email: true, name: true } } }
  });

  console.log('✅ Compte coach créé');
  console.log('Email   :', email);
  console.log('Password:', password);
  console.log('Coach ID:', coach.id);
  console.log('User ID :', user.id);

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
