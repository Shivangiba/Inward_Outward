const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('User', 'InwardOutwardOffice', 'Inward', 'Outward', 'CourierCompany')
        AND column_name ILIKE '%team%'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

main().catch(console.error);
