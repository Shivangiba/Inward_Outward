
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing Prisma connection...");
        const count = await prisma.user.count();
        console.log("User count:", count);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log("Testing Inward count...");
        const inwardCount = await prisma.inward.count();
        console.log("Inward count:", inwardCount);

        console.log("Testing GroupBy InwardDate...");
        const inwardVolume = await prisma.inward.groupBy({
            by: ['InwardDate'],
            where: {
                InwardDate: { gte: sevenDaysAgo }
            },
            _count: { InwardID: true },
        });
        console.log("Inward Volume:", JSON.stringify(inwardVolume, null, 2));

        console.log("Testing GroupBy InOutwardModeID...");
        const modeStats = await prisma.inward.groupBy({
            by: ['InOutwardModeID'],
            _count: { InwardID: true },
        });
        console.log("Mode Stats:", JSON.stringify(modeStats, null, 2));

    } catch (err) {
        console.error("DEBUG ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
