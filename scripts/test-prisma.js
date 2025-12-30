const { PrismaClient } = require('@prisma/client');
(async () => {
  try {
    // Use the v7 adapter API.
    const { PrismaPg } = require('@prisma/adapter-pg');
    const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/saas' }) });
    console.log('constructed');
    await p.$connect();
    console.log('connected');
    await p.$disconnect();
  } catch (e) {
    console.error('ERR', e);
  }
})();