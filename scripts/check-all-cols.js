const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const tables = ['Inward', 'Outward', 'CourierCompany', 'InOutwardMode', 'InOutwardFromTo'];
    for (const table of tables) {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [table]);
        console.log(`Table: ${table}`);
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    }
    await pool.end();
}

main().catch(console.error);
