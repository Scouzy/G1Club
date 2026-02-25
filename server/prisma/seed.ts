import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sportemergence.com';
  const password = 'admin'; // Mot de passe simple pour commencer
  const hashedPassword = await bcrypt.hash(password, 10);

  // Upsert default club
  const club = await prisma.club.upsert({
    where: { id: 'default-club-id' },
    update: {},
    create: { id: 'default-club-id', name: 'Linas' },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Dirigeant',
      password: hashedPassword,
      role: 'ADMIN',
      clubId: club.id,
    },
  });

  console.log({ user });
  console.log(`Dirigeant created: ${email} / ${password}`);

  const categories = [
    'Baby foot', 'U6', 'U7', 'U8', 'U9', 'U10', 
    'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 
    'U17', 'U18', 'U19', 'Séniors'
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { clubId_name: { clubId: club.id, name: cat } },
      update: {},
      create: { name: cat, clubId: club.id },
    });
  }
  console.log('Categories seeded');

  // Seed a demo coach
  const coachEmail = 'coach@sportemergence.com';
  const coachPassword = 'coach123';
  const hashedCoachPassword = await bcrypt.hash(coachPassword, 10);

  const coachUser = await prisma.user.upsert({
    where: { email: coachEmail },
    update: {},
    create: {
      email: coachEmail,
      name: 'Coach Démo',
      password: hashedCoachPassword,
      role: 'COACH',
      clubId: club.id,
    },
  });

  await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      bio: 'Coach de démonstration',
      qualifications: 'Diplôme d\'État',
    },
  });

  console.log(`Coach created: ${coachEmail} / ${coachPassword}`);
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
