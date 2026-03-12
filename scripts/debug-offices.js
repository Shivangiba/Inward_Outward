const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT "userId", "officeName" FROM "InwardOutwardOffice"');
    console.log(res.rows);
    await pool.end();
}

main().catch(console.error);
