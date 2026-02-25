const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.log('Users marked as verified:', result.count);
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
