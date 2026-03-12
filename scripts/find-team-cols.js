const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query(`
        SELECT column_name, table_name
        FROM information_schema.columns 
        WHERE column_name ILIKE '%team%'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

main().catch(console.error);
