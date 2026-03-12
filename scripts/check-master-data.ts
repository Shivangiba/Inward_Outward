import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking InOutwardMode Records ---');
    const modes = await prisma.inOutwardMode.findMany();

    console.log(`Total modes found: ${modes.length}`);

    const recordsWithNullTeam = modes.filter(m => m.TeamID === null);
    console.log(`Records with null TeamID: ${recordsWithNullTeam.length}`);

    if (recordsWithNullTeam.length > 0) {
        console.log('Sample null TeamID records:');
        recordsWithNullTeam.forEach(m => {
            console.log(`- ID: ${m.InOutwardModeID}, Name: ${m.InOutwardModeName}, Created: ${m.Created}`);
        });
    }

    // Also check other masters
    console.log('\n--- Checking InwardOutwardOffice Records ---');
    const offices = await prisma.inwardOutwardOffice.findMany();
    console.log(`Total offices: ${offices.length}, Null TeamID: ${offices.filter(o => o.TeamID === null).length}`);

    console.log('\n--- Checking InOutwardFromTo Records ---');
    const fromTos = await prisma.inOutwardFromTo.findMany();
    console.log(`Total fromTos: ${fromTos.length}, Null TeamID: ${fromTos.filter(f => f.TeamID === null).length}`);

    console.log('\n--- Checking CourierCompany Records ---');
    const couriers = await prisma.courierCompany.findMany();
    console.log(`Total couriers: ${couriers.length}, Null TeamID: ${couriers.filter(c => c.TeamID === null).length}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
