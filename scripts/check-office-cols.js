const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'InwardOutwardOffice'
    `);
    console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    await pool.end();
}

main().catch(console.error);
