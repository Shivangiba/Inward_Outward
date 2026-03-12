const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const res = await pool.query('SELECT "TeamID", "TeamName" FROM "Team"');
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

main().catch(console.error);
