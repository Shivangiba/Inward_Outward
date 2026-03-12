const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('UPDATE "InwardOutwardOffice" SET "userId" = 12');
    console.log('Updated', res.rowCount, 'offices');
    await pool.end();
}

main().catch(console.error);
