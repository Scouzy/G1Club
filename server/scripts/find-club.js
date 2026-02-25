const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const clubs = await p.club.findMany();
  console.log(JSON.stringify(clubs, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
