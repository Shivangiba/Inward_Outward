const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const tables = [
        'Inward',
        'Outward',
        'InOutwardMode',
        'CourierCompany',
        'InOutwardFromTo',
        'InwardOutwardOffice'
    ];
    for (const table of tables) {
        const res = await pool.query(`UPDATE "${table}" SET "userId" = 12 WHERE "userId" NOT IN (SELECT "UserID" FROM "User")`);
        console.log(`Cleaned up ${table}: ${res.rowCount} rows`);
    }
    await pool.end();
}

main().catch(console.error);
