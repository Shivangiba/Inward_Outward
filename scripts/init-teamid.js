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
        const res = await pool.query(`UPDATE "${table}" SET "teamId" = 1 WHERE "teamId" IS NULL`);
        console.log(`Initialized ${table} with teamId=1: ${res.rowCount} rows`);
    }
    await pool.end();
}

main().catch(console.error);
