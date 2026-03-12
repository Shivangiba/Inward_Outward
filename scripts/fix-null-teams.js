const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing Missing TeamIDs in Master Tables ---');

    // Get all teams
    const teams = await prisma.team.findMany();
    if (teams.length === 0) {
        console.log('No teams found. Cannot fix.');
        return;
    }

    // For now, if there is only one team OR we can guess the team from the user who created it
    // But let's first see whose records they are.

    const tables = [
        { name: 'inOutwardMode', idField: 'InOutwardModeID' },
        { name: 'inwardOutwardOffice', idField: 'InwardOutwardOfficeID' },
        { name: 'inOutwardFromTo', idField: 'InOutwardFromToID' },
        { name: 'courierCompany', idField: 'CourierCompanyID' }
    ];

    for (const table of tables) {
        console.log(`Checking ${table.name}...`);
        const records = await prisma[table.name].findMany({
            where: { TeamID: null },
            include: { user: true }
        });

        console.log(`Found ${records.length} records with null TeamID in ${table.name}.`);

        for (const record of records) {
            if (record.user && record.user.TeamID) {
                console.log(`Fixing ${table.name} ID ${record[table.idField]} -> Setting TeamID ${record.user.TeamID} (from user ${record.user.Email})`);
                await prisma[table.name].update({
                    where: { [table.idField]: record[table.idField] },
                    data: { TeamID: record.user.TeamID }
                });
            } else {
                console.log(`Could not fix ${table.name} ID ${record[table.idField]} - user has no TeamID.`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
