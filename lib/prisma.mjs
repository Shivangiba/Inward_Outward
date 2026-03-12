import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// For Prisma 7, use the driver adapter
const prisma = new PrismaClient({ adapter });

export default prisma;
