const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Inward schema:',
        Object.entries(require('@prisma/client').Prisma.InwardScalarFieldEnum).map(([k, v]) => `${k}`).join(', ')
    );
}

main().catch(console.error);
