import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Clean up legacy roles if they exist
    const roles = await prisma.role.findMany();
    const legacySuperAdmin = roles.find(r => r.RoleName.toLowerCase() === 'superadmin' || r.RoleName.toLowerCase() === 'super admin');

    const superAdminRole = await prisma.role.upsert({
        where: { RoleName: 'Super Admin' },
        update: {},
        create: { RoleName: 'Super Admin' },
    });

    if (legacySuperAdmin && legacySuperAdmin.RoleID !== superAdminRole.RoleID) {
        console.log(`Migrating users from ${legacySuperAdmin.RoleName} to Super Admin...`);
        await prisma.user.updateMany({
            where: { RoleID: legacySuperAdmin.RoleID },
            data: { RoleID: superAdminRole.RoleID }
        });
        await prisma.role.delete({ where: { RoleID: legacySuperAdmin.RoleID } });
    }

    const adminRole = await prisma.role.upsert({
        where: { RoleName: 'admin' },
        update: {},
        create: { RoleName: 'admin' },
    });

    const clerkRole = await prisma.role.upsert({
        where: { RoleName: 'clerk' },
        update: {},
        create: { RoleName: 'clerk' },
    });

    console.log('Seeding teams...');
    const generalTeam = await prisma.team.upsert({
        where: { TeamName: 'General' },
        update: {},
        create: { TeamName: 'General' },
    });

    console.log('Seeding users...');
    await prisma.user.upsert({
        where: { Email: 'super@123.com' },
        update: {},
        create: {
            Email: 'super@123.com',
            Password: 'super123',
            RoleID: superAdminRole.RoleID,
            Name: 'Super Admin',
            TeamID: generalTeam.TeamID,
        },
    });

    await prisma.user.upsert({
        where: { Email: 'admin@123.com' },
        update: {},
        create: {
            Email: 'admin@123.com',
            Password: 'admin123',
            RoleID: adminRole.RoleID,
            Name: 'Admin User',
            TeamID: generalTeam.TeamID,
        },
    });

    await prisma.user.upsert({
        where: { Email: 'clerk@123.com' },
        update: {},
        create: {
            Email: 'clerk@123.com',
            Password: 'clerk123',
            RoleID: clerkRole.RoleID,
            Name: 'Clerk User',
            TeamID: generalTeam.TeamID,
        },
    });

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
