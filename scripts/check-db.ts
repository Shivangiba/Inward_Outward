import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Roles ---');
    const roles = await prisma.role.findMany();
    console.log(JSON.stringify(roles, null, 2));

    console.log('\n--- Users ---');
    const users = await prisma.user.findMany({
        include: { role: true }
    });
    console.log(JSON.stringify(users.map(u => ({
        UserID: u.UserID,
        Email: u.Email,
        Name: u.Name,
        Role: u.role.RoleName,
        Password: u.Password
    })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
