const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  const email = 'jayden.gomis@linas.fr';
  const password = 'jayden123';
  const sportifId = '12b497a8-1039-4181-83a3-c89756b9fa22';

  // Check if user already exists
  const existing = await p.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Compte déjà existant:', existing.email);
    await p.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await p.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Jayden GOMIS',
      role: 'SPORTIF',
      clubId: 'default-club-id',
      emailVerified: true,
    }
  });

  // Link user to sportif profile
  await p.sportif.update({
    where: { id: sportifId },
    data: { userId: user.id }
  });

  console.log('✅ Compte créé et lié au profil sportif');
  console.log('Email:', email);
  console.log('Mot de passe:', password);
  console.log('User ID:', user.id);

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
