import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    fs.writeFileSync('roles_dump.json', JSON.stringify(roles, null, 2));
}

main()
    .catch(e => fs.writeFileSync('roles_check_error.txt', e.stack))
    .finally(async () => await prisma.$disconnect());
