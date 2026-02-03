import { prisma } from '../config/database';
import { disconnectRedis } from '../config/redis';

beforeAll(async () => {
  // Ensure database is connected
});

afterAll(async () => {
  // Clean up
  await prisma.$disconnect();
  await disconnectRedis();
});

// Helper to clean database between tests
export const cleanDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
};
